"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { ShoppingCart } from "lucide-react";

export function OrderForm() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) return;
    if (items.length === 0) { setError("Your cart is empty"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          notes: form.notes || null,
          items: items.map(i => ({
            product_id: i.id,
            product_name: i.product_name,
            product_sku: i.sku,
            quantity: i.quantity,
            price: i.price,
            cost: 0,
          })),
        }),
      });
      if (res.ok) {
        const order = await res.json();
        clear();
        router.push(`/orders/${order.order_number}/confirmation`);
      } else {
        const err = await res.json();
        setError(err.error ?? "Failed to place order");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div id="order-form" className="card max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>
          <ShoppingCart size={18} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Place Your Order</h2>
      </div>

      {/* Cart summary */}
      <div className="rounded-lg p-3 mb-5 space-y-2" style={{ background: "var(--muted)" }}>
        {items.map(i => (
          <div key={i.id} className="flex justify-between text-sm">
            <span style={{ color: "var(--text)" }}>{i.product_name} <span className="font-mono" style={{ color: "var(--text-dim)" }}>×{i.quantity}</span></span>
            <span className="font-mono font-medium" style={{ color: "var(--text)" }}>${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t pt-2 flex justify-between font-semibold" style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--text)" }}>Total</span>
          <span className="font-mono" style={{ color: "var(--accent)" }}>${total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Your Name *</label>
          <input className="input-field" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Phone Number *</label>
          <input className="input-field" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input-field" rows={2} placeholder="Any special requests, delivery notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
          {submitting ? "Placing Order…" : "Submit Order Request"}
        </button>
        <p className="text-xs text-center" style={{ color: "var(--text-dim)" }}>
          We'll contact you to confirm availability and arrange pickup/delivery.
        </p>
      </form>
    </div>
  );
}
