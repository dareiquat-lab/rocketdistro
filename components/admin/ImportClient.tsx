"use client";

import { useState, useRef } from "react";
import { Sparkles, Upload, X, Check, AlertTriangle, FileText } from "lucide-react";

type Mode = "order" | "invoice" | "client";

interface ParsedOrder {
  client: { first_name: string; last_name: string; phone: string | null };
  items: { product_name: string; quantity: number; unit_price: number }[];
  notes: string | null;
  ordered_at: string | null;
  message_fingerprint: string;
}

interface ParsedInvoiceData {
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  total: number;
  source: "excel" | "ai";
  items: { name: string; brand?: string | null; category: string; quantity: number; unit_cost: number }[];
}

interface ParsedClient {
  business_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

interface ExistingClient {
  id: number;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

type ClientAction = "create" | "merge" | "skip";

interface ClientResolution {
  parsed: ParsedClient;
  existing: ExistingClient | null;
  action: ClientAction;
  checked: boolean;
}

function isExcelFile(f: File) {
  return /\.(xlsx|xls)$/i.test(f.name) || f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || f.type === "application/vnd.ms-excel";
}

export function ImportClient() {
  const [mode, setMode] = useState<Mode>("order");
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<unknown>(null);
  const [invoiceData, setInvoiceData] = useState<ParsedInvoiceData | null>(null);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [error, setError] = useState("");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [clientResolutions, setClientResolutions] = useState<ClientResolution[]>([]);
  const [checkingDupes, setCheckingDupes] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useState(() => {
    fetch("/api/ai-parse/status").then(r => r.json()).then(d => setAiAvailable(d.configured));
  });

  const reset = () => {
    setParsed(null);
    setInvoiceData(null);
    setClientResolutions([]);
    setFiles([]);
    setCommitted(false);
    setError("");
  };

  const removeFile = (i: number) => setFiles(f => f.filter((_, idx) => idx !== i));

  // Smart invoice parser — routes to Excel or AI based on file type
  const handleInvoiceParse = async () => {
    if (files.length === 0) return;
    setParsing(true);
    setError("");
    setInvoiceData(null);
    try {
      const excelFile = files.find(isExcelFile);
      if (excelFile) {
        const formData = new FormData();
        formData.append("file", excelFile);
        const res = await fetch("/api/admin/excel-import", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setInvoiceData({ ...data, source: "excel" });
        } else {
          const err = await res.json();
          setError(err.error ?? "Could not read Excel file");
        }
      } else {
        // Image / PDF path via AI
        const formData = new FormData();
        formData.append("mode", "invoice");
        files.forEach(f => formData.append("files", f));
        const res = await fetch("/api/ai-parse", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          const allItems = (data.results ?? []).flatMap((r: { supplier?: string; items?: { name: string; brand?: string | null; category: string; quantity: number; unit_cost: number }[] }) => r.items ?? []);
          const supplierName = (data.results ?? []).find((r: { supplier?: string }) => r.supplier)?.supplier ?? "";
          const total = allItems.reduce((s: number, i: { quantity: number; unit_cost: number }) => s + i.quantity * i.unit_cost, 0);
          setInvoiceData({ supplier_name: supplierName, invoice_number: "", invoice_date: "", items: allItems, total, source: "ai" });
        } else {
          const err = await res.json();
          setError(err.error ?? "Parse failed");
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setParsing(false);
    }
  };

  const handleParse = async () => {
    if (files.length === 0) return;
    setParsing(true);
    setError("");
    setParsed(null);
    try {
      const formData = new FormData();
      formData.append("mode", mode);
      files.forEach(f => formData.append("files", f));
      const res = await fetch("/api/ai-parse", { method: "POST", body: formData });
      if (res.ok) {
        setParsed(await res.json());
      } else {
        const err = await res.json();
        setError(err.error ?? "Parse failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setParsing(false);
    }
  };

  const handleCommitOrders = async (orders: ParsedOrder[]) => {
    setCommitting(true);
    try {
      for (const order of orders) {
        const name = [order.client.first_name, order.client.last_name].filter(Boolean).join(" ") || "Unknown Customer";
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: name,
            customer_phone: order.client.phone ?? "",
            customer_email: "",
            notes: order.notes,
            items: order.items.map(i => ({
              product_name: i.product_name,
              quantity: i.quantity,
              price: i.unit_price,
              cost: 0,
              product_id: null,
              product_sku: null,
            })),
          }),
        });
      }
      setCommitted(true);
    } finally {
      setCommitting(false);
    }
  };

  const handleCommitInvoice = async () => {
    if (!invoiceData) return;
    setCommitting(true);
    setError("");
    try {
      // Upload the original file to blob storage so it can be viewed later
      let fileUrl: string | null = null;
      const primaryFile = files[0] ?? null;
      if (primaryFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", primaryFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileUrl = uploadData.url ?? null;
        }
      }

      await fetch("/api/admin/supplier-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoiceData.invoice_number || null,
          supplier_name: invoiceData.supplier_name || "Unknown Supplier",
          invoice_date: invoiceData.invoice_date || null,
          total_amount: invoiceData.total,
          import_source: invoiceData.source,
          file_url: fileUrl,
          items: invoiceData.items,
        }),
      });

      for (const item of invoiceData.items) {
        // Upsert the brand and capture the server-normalized brand name
        let brandName: string | null = item.brand ?? null;
        let brandImageUrl: string | null = null;
        if (item.brand) {
          const brandRes = await fetch("/api/admin/brands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: item.brand }),
          });
          if (brandRes.ok) {
            const brandData = await brandRes.json();
            brandName = brandData.name ?? brandName;
            brandImageUrl = brandData.image_url ?? null;
          }
        }

        const searchRes = await fetch(`/api/products?admin=true&search=${encodeURIComponent(item.name)}&limit=5`);
        let productId: number | null = null;
        if (searchRes.ok) {
          const data = await searchRes.json();
          const match = (data.products ?? []).find((p: { product_name: string; quantity: number; brand?: string | null }) =>
            p.product_name.toLowerCase() === item.name.toLowerCase()
          );
          if (match) {
            productId = match.id;
            await fetch(`/api/products/${match.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                quantity: match.quantity + item.quantity,
                cost: item.unit_cost,
                ...(brandName && !match.brand ? { brand: brandName } : {}),
              }),
            });
          }
        }
        if (!productId) {
          const effectiveCategory = brandName || item.category || "General";
          const catRes = await fetch("/api/admin/categories");
          const cats = catRes.ok ? await catRes.json() : [];
          const matchedCat = (Array.isArray(cats) ? cats : []).find((c: { name: string }) =>
            c.name.toLowerCase() === effectiveCategory.toLowerCase()
          );
          if (!matchedCat && effectiveCategory) {
            await fetch("/api/admin/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: effectiveCategory, icon: "🏷️" }),
            });
          }
          const createRes = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_name: item.name,
              category: effectiveCategory,
              sku: `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
              quantity: item.quantity,
              price: 0,
              cost: item.unit_cost,
              brand: brandName,
              image_url: brandImageUrl,
            }),
          });
          if (!createRes.ok) {
            const err = await createRes.json().catch(() => ({ error: `HTTP ${createRes.status}` }));
            throw new Error(`Failed to import "${item.name}": ${err.error ?? createRes.status}`);
          }
        }
      }
      setCommitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed. Please try again.");
    } finally {
      setCommitting(false);
    }
  };

  const checkForDuplicates = async (clients: ParsedClient[]) => {
    setCheckingDupes(true);
    const resolutions: ClientResolution[] = [];
    for (const client of clients) {
      if (!client.business_name && !client.contact_name) continue;
      const query = client.phone || client.business_name || client.contact_name || "";
      let existing: ExistingClient | null = null;
      if (query) {
        const res = await fetch(`/api/admin/clients?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const candidates: ExistingClient[] = data.clients ?? [];
          existing = candidates.find(c =>
            (client.phone && c.phone === client.phone) ||
            (client.business_name && c.business_name.toLowerCase() === (client.business_name ?? "").toLowerCase())
          ) ?? null;
        }
      }
      resolutions.push({ parsed: client, existing, action: existing ? "merge" : "create", checked: true });
    }
    setClientResolutions(resolutions);
    setCheckingDupes(false);
  };

  const handleCommitClients = async () => {
    setCommitting(true);
    try {
      for (const r of clientResolutions) {
        if (r.action === "skip") continue;
        const payload = {
          business_name: r.parsed.business_name || r.parsed.contact_name || "Unknown",
          contact_name: r.parsed.contact_name,
          phone: r.parsed.phone,
          email: r.parsed.email,
          address: r.parsed.address,
          notes: r.parsed.notes,
        };
        if (r.action === "merge" && r.existing) {
          await fetch(`/api/admin/clients/${r.existing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              business_name: r.parsed.business_name || r.existing.business_name,
              contact_name: r.parsed.contact_name || r.existing.contact_name,
              phone: r.parsed.phone || r.existing.phone,
              email: r.parsed.email || r.existing.email,
              address: r.parsed.address || r.existing.address,
              notes: [r.existing.notes, r.parsed.notes].filter(Boolean).join(" | ") || null,
            }),
          });
        } else {
          await fetch("/api/admin/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }
      setCommitted(true);
    } finally {
      setCommitting(false);
    }
  };

  const results = parsed as { results?: unknown[]; mode?: string } | null;
  const hasExcel = files.some(isExcelFile);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {!aiAvailable && aiAvailable !== null && mode !== "invoice" && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(217,119,6,0.1)", border: "1px solid var(--warning)" }}>
          <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
          <p className="text-sm" style={{ color: "var(--warning)" }}>ANTHROPIC_API_KEY is not set. AI parsing is unavailable.</p>
        </div>
      )}
      {!aiAvailable && aiAvailable !== null && mode === "invoice" && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(217,119,6,0.1)", border: "1px solid var(--warning)" }}>
          <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
          <p className="text-sm" style={{ color: "var(--warning)" }}>ANTHROPIC_API_KEY is not set. Image/PDF parsing is unavailable. Excel files can still be imported.</p>
        </div>
      )}

      {/* Mode selector */}
      <div className="flex gap-2">
        {([
          { value: "order" as Mode, label: "Order Screenshot", icon: "💬" },
          { value: "invoice" as Mode, label: "Supplier Invoice", icon: "📋" },
          { value: "client" as Mode, label: "Client Document", icon: "👤" },
        ]).map(m => (
          <button
            key={m.value}
            onClick={() => { setMode(m.value); reset(); }}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: mode === m.value ? "var(--accent)" : "var(--surface)",
              color: mode === m.value ? "white" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Upload area */}
      {!parsed && !invoiceData && (
        <div className="card space-y-4">
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderColor: "var(--border)", background: "var(--muted)" }}
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
            onDragOver={e => e.preventDefault()}
          >
            <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
            <p className="font-medium" style={{ color: "var(--text)" }}>
              {mode === "order" ? "Upload chat screenshots" : mode === "invoice" ? "Upload invoice images, PDFs, or Excel files" : "Upload business documents"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {mode === "invoice" ? "JPEG, PNG, WebP, PDF, or .xlsx / .xls · Multiple files allowed" : "JPEG, PNG, WebP, or PDF · Multiple files allowed"}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={mode === "invoice" ? "image/*,.pdf,.xlsx,.xls" : "image/*,.pdf"}
            className="hidden"
            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])}
          />

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                  <FileText size={16} style={{ color: "var(--text-dim)" }} />
                  <span className="text-sm flex-1 truncate" style={{ color: "var(--text)" }}>{f.name}</span>
                  <button onClick={() => removeFile(i)} style={{ color: "var(--text-dim)" }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

          <button
            className="btn-primary w-full justify-center"
            onClick={mode === "invoice" ? handleInvoiceParse : handleParse}
            disabled={parsing || files.length === 0 || (mode !== "invoice" && !aiAvailable) || (mode === "invoice" && !hasExcel && !aiAvailable)}
          >
            {mode === "invoice" && hasExcel ? (
              <><FileText size={14} /> {parsing ? "Reading file…" : "Parse Invoice"}</>
            ) : (
              <><Sparkles size={14} /> {parsing ? "Parsing with AI…" : "Parse with Claude AI"}</>
            )}
          </button>
        </div>
      )}

      {/* Invoice results */}
      {invoiceData && !committed && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>Invoice Preview</h3>
            <button className="btn-secondary text-xs py-1" onClick={() => { setInvoiceData(null); setFiles([]); }}>Start Over</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Supplier</p>
              <p style={{ color: "var(--text)" }}>{invoiceData.supplier_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Invoice #</p>
              <p style={{ color: "var(--text)" }}>{invoiceData.invoice_number || "—"}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Date</p>
              <p style={{ color: "var(--text)" }}>{invoiceData.invoice_date || "—"}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Total</p>
              <p className="font-mono" style={{ color: "var(--text)" }}>${invoiceData.total.toFixed(2)}</p>
            </div>
          </div>
          <div className="table-container">
            <table className="table-base">
              <thead><tr><th>Product</th><th>Brand</th><th>Category</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
              <tbody>
                {invoiceData.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text)" }}>{item.name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{item.brand || "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{item.category || "—"}</td>
                    <td className="font-mono">{item.quantity}</td>
                    <td className="font-mono">${item.unit_cost.toFixed(2)}</td>
                    <td className="font-mono">${(item.quantity * item.unit_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>Saves to Supplier Invoices and updates inventory quantities.</p>
          <button className="btn-primary w-full justify-center" onClick={handleCommitInvoice} disabled={committing}>
            <Check size={14} /> {committing ? "Importing…" : `Import ${invoiceData.items.length} Items`}
          </button>
        </div>
      )}

      {/* Order / Client results */}
      {results && !committed && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>Parsed Results</h3>
            <button className="btn-secondary text-xs py-1" onClick={() => { setParsed(null); setClientResolutions([]); setFiles([]); }}>Start Over</button>
          </div>

          {mode === "order" && (() => {
            const allOrders: ParsedOrder[] = (results.results ?? []).flatMap((r) => ((r as { orders?: ParsedOrder[] }).orders ?? []));
            return (
              <div className="space-y-3">
                {allOrders.map((order, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                      {[order.client.first_name, order.client.last_name].filter(Boolean).join(" ") || "Unknown Customer"}
                    </p>
                    {order.client.phone && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.client.phone}</p>}
                    <div className="mt-2 space-y-1">
                      {order.items.map((item, j) => (
                        <div key={j} className="flex justify-between text-xs">
                          <span style={{ color: "var(--text)" }}>{item.product_name} &times;{item.quantity}</span>
                          {item.unit_price > 0 && <span className="font-mono" style={{ color: "var(--text-muted)" }}>${item.unit_price.toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                    {order.notes && <p className="text-xs mt-1 italic" style={{ color: "var(--text-dim)" }}>{order.notes}</p>}
                  </div>
                ))}
                <button className="btn-primary w-full justify-center" onClick={() => handleCommitOrders(allOrders)} disabled={committing}>
                  <Check size={14} /> {committing ? "Creating Orders…" : `Create ${allOrders.length} Order${allOrders.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            );
          })()}

          {mode === "client" && (() => {
            const allClients: ParsedClient[] = (results.results ?? []).flatMap((r) => ((r as { clients?: ParsedClient[] }).clients ?? []));
            const resReady = clientResolutions.length > 0 && clientResolutions.every(r => r.checked);
            if (!resReady) {
              return (
                <div className="space-y-3">
                  {allClients.map((client, i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                      <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{client.business_name ?? "Unknown Business"}</p>
                      {client.contact_name && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.contact_name}</p>}
                      {client.phone && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.phone}</p>}
                      {client.email && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.email}</p>}
                      {client.address && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.address}</p>}
                    </div>
                  ))}
                  <button className="btn-primary w-full justify-center" onClick={() => checkForDuplicates(allClients)} disabled={checkingDupes}>
                    <Check size={14} /> {checkingDupes ? "Checking for duplicates…" : `Review & Save ${allClients.length} Client${allClients.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              );
            }
            const newCount = clientResolutions.filter(r => r.action === "create").length;
            const mergeCount = clientResolutions.filter(r => r.action === "merge").length;
            const skipCount = clientResolutions.filter(r => r.action === "skip").length;
            return (
              <div className="space-y-3">
                {clientResolutions.map((r, i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <div className="p-3" style={{ background: "var(--muted)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{r.parsed.business_name ?? r.parsed.contact_name ?? "Unknown"}</p>
                          {r.parsed.contact_name && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.parsed.contact_name}</p>}
                          {r.parsed.phone && <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{r.parsed.phone}</p>}
                          {r.parsed.email && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.parsed.email}</p>}
                          {r.parsed.address && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.parsed.address}</p>}
                        </div>
                        {r.existing && (
                          <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(217,119,6,0.12)", color: "var(--warning)" }}>
                            Duplicate found
                          </span>
                        )}
                      </div>
                      {r.existing && (
                        <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
                          Existing: <span style={{ color: "var(--text-muted)" }}>{r.existing.business_name}</span>
                          {r.existing.phone && <> · {r.existing.phone}</>}
                        </div>
                      )}
                    </div>
                    <div className="flex border-t" style={{ borderColor: "var(--border)" }}>
                      {r.existing ? (
                        <>
                          <button
                            onClick={() => setClientResolutions(prev => prev.map((x, j) => j === i ? { ...x, action: "merge" } : x))}
                            className="flex-1 py-2 text-xs font-medium transition-colors"
                            style={{ background: r.action === "merge" ? "var(--accent)" : "var(--surface)", color: r.action === "merge" ? "white" : "var(--text-muted)" }}
                          >
                            Merge
                          </button>
                          <button
                            onClick={() => setClientResolutions(prev => prev.map((x, j) => j === i ? { ...x, action: "skip" } : x))}
                            className="flex-1 py-2 text-xs font-medium transition-colors border-l"
                            style={{ borderColor: "var(--border)", background: r.action === "skip" ? "var(--muted)" : "var(--surface)", color: r.action === "skip" ? "var(--text)" : "var(--text-muted)" }}
                          >
                            Skip
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 py-2 text-xs text-center" style={{ color: "var(--success)" }}>New client — will be created</div>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-center" style={{ color: "var(--text-dim)" }}>
                  {newCount} new · {mergeCount} merge · {skipCount} skip
                </p>
                <button className="btn-primary w-full justify-center" onClick={handleCommitClients} disabled={committing || newCount + mergeCount === 0}>
                  <Check size={14} /> {committing ? "Saving…" : `Confirm (${newCount + mergeCount} clients)`}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Success */}
      {committed && (
        <div className="card text-center py-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(22,163,74,0.1)" }}>
            <Check size={28} style={{ color: "var(--success)" }} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>Done!</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            {mode === "order" ? "Orders created successfully." : mode === "invoice" ? "Invoice saved and inventory updated." : "Clients saved successfully."}
          </p>
          <button className="btn-primary" onClick={reset}>Import More</button>
        </div>
      )}
    </div>
  );
}
