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

interface ParsedInvoiceItem {
  name: string;
  category: string;
  quantity: number;
  unit_cost: number;
}

interface ParsedClient {
  business_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  tobacco_license_number: string | null;
  sellers_permit_number: string | null;
}

export function ImportClient() {
  const [mode, setMode] = useState<Mode>("order");
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<unknown>(null);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [error, setError] = useState("");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useState(() => {
    fetch("/api/ai-parse/status").then(r => r.json()).then(d => setAiAvailable(d.configured));
  });

  const removeFile = (i: number) => setFiles(f => f.filter((_, idx) => idx !== i));

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
        const data = await res.json();
        setParsed(data);
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

  const handleCommitInvoice = async (items: ParsedInvoiceItem[]) => {
    setCommitting(true);
    try {
      for (const item of items) {
        const searchRes = await fetch(`/api/products?admin=true&search=${encodeURIComponent(item.name)}&limit=5`);
        let productId: number | null = null;
        if (searchRes.ok) {
          const data = await searchRes.json();
          const match = (data.products ?? []).find((p: { product_name: string }) =>
            p.product_name.toLowerCase() === item.name.toLowerCase()
          );
          if (match) {
            productId = match.id;
            await fetch(`/api/products/${match.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantity: match.quantity + item.quantity, cost: item.unit_cost }),
            });
          }
        }
        if (!productId) {
          const catRes = await fetch(`/api/admin/categories`);
          const cats = catRes.ok ? await catRes.json() : [];
          const matchedCat = (Array.isArray(cats) ? cats : []).find((c: { name: string }) =>
            c.name.toLowerCase() === (item.category ?? "").toLowerCase()
          );
          if (!matchedCat && item.category) {
            await fetch("/api/admin/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: item.category, icon: "📦" }),
            });
          }
          await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_name: item.name,
              category: item.category || "General",
              sku: `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
              quantity: item.quantity,
              price: 0,
              cost: item.unit_cost,
            }),
          });
        }
      }
      setCommitted(true);
    } finally {
      setCommitting(false);
    }
  };

  const handleCommitClients = async (clients: ParsedClient[]) => {
    setCommitting(true);
    try {
      for (const client of clients) {
        if (!client.business_name && !client.contact_name) continue;
        await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_name: client.business_name || client.contact_name || "Unknown",
            contact_name: client.contact_name,
            phone: client.phone,
            email: client.email,
            address: client.address,
            city: client.city,
            state: client.state,
            zip: client.zip,
            tobacco_license_number: client.tobacco_license_number,
            sellers_permit_number: client.sellers_permit_number,
            client_type: "Retailer",
          }),
        });
      }
      setCommitted(true);
    } finally {
      setCommitting(false);
    }
  };

  const results = parsed as { results?: unknown[]; mode?: string } | null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {!aiAvailable && aiAvailable !== null && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(217,119,6,0.1)", border: "1px solid var(--warning)" }}>
          <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
          <p className="text-sm" style={{ color: "var(--warning)" }}>ANTHROPIC_API_KEY is not set. AI parsing is unavailable.</p>
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
            onClick={() => { setMode(m.value); setParsed(null); setCommitted(false); }}
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
      {!parsed && (
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
              {mode === "order" ? "Upload chat screenshots" : mode === "invoice" ? "Upload invoice images or PDFs" : "Upload business documents"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>JPEG, PNG, WebP, or PDF · Multiple files allowed</p>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])} />

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
            onClick={handleParse}
            disabled={parsing || files.length === 0 || !aiAvailable}
          >
            <Sparkles size={14} />
            {parsing ? "Parsing with AI…" : "Parse with Claude AI"}
          </button>
        </div>
      )}

      {/* Results */}
      {results && !committed && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>Parsed Results</h3>
            <button className="btn-secondary text-xs py-1" onClick={() => { setParsed(null); setFiles([]); }}>Start Over</button>
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

          {mode === "invoice" && (() => {
            const allItems: ParsedInvoiceItem[] = (results.results ?? []).flatMap((r) => ((r as { items?: ParsedInvoiceItem[] }).items ?? []));
            return (
              <div className="space-y-3">
                <div className="table-container">
                  <table className="table-base">
                    <thead><tr><th>Product</th><th>Category</th><th>Qty</th><th>Unit Cost</th></tr></thead>
                    <tbody>
                      {allItems.map((item, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--text)" }}>{item.name}</td>
                          <td style={{ color: "var(--text-muted)" }}>{item.category}</td>
                          <td className="font-mono">{item.quantity}</td>
                          <td className="font-mono">${item.unit_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn-primary w-full justify-center" onClick={() => handleCommitInvoice(allItems)} disabled={committing}>
                  <Check size={14} /> {committing ? "Importing…" : `Import ${allItems.length} Items`}
                </button>
              </div>
            );
          })()}

          {mode === "client" && (() => {
            const allClients: ParsedClient[] = (results.results ?? []).flatMap((r) => ((r as { clients?: ParsedClient[] }).clients ?? []));
            return (
              <div className="space-y-3">
                {allClients.map((client, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{client.business_name ?? "Unknown Business"}</p>
                    {client.contact_name && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.contact_name}</p>}
                    {client.phone && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.phone}</p>}
                    {client.email && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.email}</p>}
                    {client.tobacco_license_number && <p className="text-xs" style={{ color: "var(--text-dim)" }}>Tobacco: {client.tobacco_license_number}</p>}
                    {client.sellers_permit_number && <p className="text-xs" style={{ color: "var(--text-dim)" }}>Permit: {client.sellers_permit_number}</p>}
                  </div>
                ))}
                <button className="btn-primary w-full justify-center" onClick={() => handleCommitClients(allClients)} disabled={committing}>
                  <Check size={14} /> {committing ? "Saving…" : `Save ${allClients.length} Client${allClients.length !== 1 ? "s" : ""}`}
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
            {mode === "order" ? "Orders created successfully." : mode === "invoice" ? "Products imported successfully." : "Clients saved successfully."}
          </p>
          <button className="btn-primary" onClick={() => { setParsed(null); setFiles([]); setCommitted(false); }}>Import More</button>
        </div>
      )}
    </div>
  );
}
