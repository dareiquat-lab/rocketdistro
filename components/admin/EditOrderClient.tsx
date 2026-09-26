"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, X, ChevronLeft, User, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { ClientPicker } from "@/components/admin/ClientPicker";
import type { Order, Product, Client } from "@/types";
import { ORDER_STATUSES } from "@/types";

interface CartItem {
  product_id: number | null;
  product_name: string;
  product_sku: string | null;
  product_brand: string | null;
  quantity: number;
  price: number;
  cost: number;
}

interface Props {
  order: Order;
  staffMode?: boolean;
}

function PriceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState<string | null>(null);
  const isEditing = raw !== null;
  return (
    <div className="flex items-center rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <span className="pl-2.5 pr-1 text-sm font-mono select-none flex-shrink-0" style={{ color: "var(--text-dim)" }}>$</span>
      <input
        type="text"
        inputMode="decimal"
        value={isEditing ? raw : (value > 0 ? value.toFixed(2) : "")}
        placeholder="0.00"
        onChange={e => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
        onFocus={() => setRaw("")}
        onBlur={() => {
          if (raw !== null && raw !== "") onChange(parseFloat(raw) || 0);
          setRaw(null);
        }}
        className="flex-1 bg-transparent text-sm font-mono py-1 pr-2.5 outline-none w-20"
        style={{ color: "var(--text)" }}
      />
    </div>
  );
}

export function EditOrderClient({ order, staffMode = false }: Props) {
  const router = useRouter();
  const backHref = staffMode ? "/staff/orders" : "/admin/orders";

  const [customerName, setCustomerName] = useState(order.customer_name);
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone);
  const [customerEmail, setCustomerEmail] = useState(order.customer_email);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [status, setStatus] = useState(order.status);

  const [cart, setCart] = useState<CartItem[]>(
    (order.items ?? []).map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      product_sku: i.product_sku,
      product_brand: i.product_brand,
      quantity: i.quantity,
      price: Number(i.price),
      cost: Number(i.cost),
    }))
  );

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!productSearch || productSearch.length < 2) { setProductResults([]); return; }
      const res = await fetch(`/api/products?admin=true&search=${encodeURIComponent(productSearch)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setProductResults(data.products ?? []);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addProduct = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === p.id);
      if (existing) return prev.map(c => c.product_id === p.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product_id: p.id, product_name: p.product_name, product_sku: p.sku, product_brand: p.brand ?? null, quantity: 1, price: Number(p.price), cost: Number(p.cost) }];
    });
    setProductSearch("");
    setProductResults([]);
  };

  const addCustomItem = () => setCart(prev => [
    ...prev,
    { product_id: null, product_name: "", product_sku: null, product_brand: null, quantity: 1, price: 0, cost: 0 },
  ]);

  const removeItem = (i: number) => setCart(prev => prev.filter((_, idx) => idx !== i));

  const setQty = (i: number, qty: number) => {
    if (qty <= 0) removeItem(i);
    else setCart(prev => prev.map((item, idx) => idx === i ? { ...item, quantity: qty } : item));
  };

  const handleClientSelect = (client: Client) => {
    setCustomerName(client.contact_name ?? client.business_name);
    setCustomerPhone(client.phone ?? "");
    setCustomerEmail(client.email ?? "");
  };

  const orderTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const canSave = customerName.trim() && customerPhone.trim() && cart.length > 0 && cart.every(i => i.product_name.trim());

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          notes,
          status,
          items: cart,
        }),
      });
      if (res.ok) {
        router.push(backHref);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Save failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-y-auto h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* Back nav */}
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
          <ChevronLeft size={15} /> Back to Orders
        </Link>

        {/* Order number + status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--text-dim)" }}>Editing Order</p>
            <h1 className="text-xl font-bold font-mono" style={{ color: "var(--accent)" }}>{order.order_number}</h1>
          </div>
          <div>
            <label className="label text-right block mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Order["status"])}
              className="input-field text-sm"
            >
              {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Customer */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)", color: "white" }}>
              <User size={14} />
            </div>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Customer</h2>
          </div>

          <ClientPicker onSelect={handleClientSelect} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input-field" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input className="input-field" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)", color: "white" }}>
                <ShoppingCart size={14} />
              </div>
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>
                Items
                {cart.length > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--muted)", color: "var(--text-muted)" }}>
                    {cart.length}
                  </span>
                )}
              </h2>
            </div>
            <button type="button" onClick={addCustomItem} className="btn-secondary py-1.5 px-3 text-xs">
              <Plus size={12} /> Custom Item
            </button>
          </div>

          {/* Product search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }} />
            <input
              className="input-field pl-9"
              placeholder="Search products to add…"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
            {productResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                {productResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    <span style={{ color: "var(--text)" }}>
                      {p.product_name}
                      {p.sku && <span className="font-mono text-xs ml-2" style={{ color: "var(--text-dim)" }}>{p.sku}</span>}
                    </span>
                    <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>${Number(p.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items table */}
          {cart.length > 0 ? (
            <div className="space-y-2">
              <div className="table-container">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-center w-32">Qty</th>
                      <th className="w-28">Unit Price</th>
                      <th className="text-right w-24">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i}>
                        <td>
                          {item.product_id === null ? (
                            <input
                              className="input-field text-sm py-1"
                              placeholder="Product name *"
                              value={item.product_name}
                              onChange={e => setCart(prev => prev.map((c, idx) => idx === i ? { ...c, product_name: e.target.value } : c))}
                            />
                          ) : (
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.product_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {item.product_brand && <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{item.product_brand}</span>}
                                {item.product_sku && <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>{item.product_sku}</span>}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setQty(i, item.quantity - 1)} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70" style={{ background: "var(--muted)", color: "var(--text)" }}><Minus size={10} /></button>
                            <input
                              type="number" min="1" value={item.quantity}
                              onChange={e => setQty(i, parseInt(e.target.value) || 1)}
                              onFocus={e => e.target.select()}
                              className="w-12 text-center text-sm font-mono rounded-lg border-0 outline-none h-6"
                              style={{ background: "var(--muted)", color: "var(--text)" }}
                            />
                            <button onClick={() => setQty(i, item.quantity + 1)} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70" style={{ background: "var(--muted)", color: "var(--text)" }}><Plus size={10} /></button>
                          </div>
                        </td>
                        <td>
                          <PriceInput value={item.price} onChange={v => setCart(prev => prev.map((c, idx) => idx === i ? { ...c, price: v } : c))} />
                        </td>
                        <td className="text-right font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td>
                          <button onClick={() => removeItem(i)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}><X size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end pt-1">
                <span className="text-xl font-bold font-mono" style={{ color: "var(--text)" }}>${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-dim)" }}>Search for a product or add a custom item above.</p>
          )}
        </div>

        {/* Notes */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Order Notes</h2>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Optional notes, special instructions…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pb-8">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="btn-primary px-8 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link href={backHref} className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Cancel
          </Link>
          {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
        </div>

      </div>
    </div>
  );
}
