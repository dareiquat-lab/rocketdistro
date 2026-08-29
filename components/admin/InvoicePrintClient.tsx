"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import type { Order } from "@/types";

interface InvoicePrintClientProps {
  order: Order;
}

export function InvoicePrintClient({ order }: InvoicePrintClientProps) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  const items = order.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white text-slate-900 min-h-screen">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* Print button */}
      <div className="no-print mb-6 flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#2563eb" }}
        >
          Print Invoice
        </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-blue-600">🚀 ROCKET DISTRO</h1>
          <p className="text-slate-500 text-sm">Wholesale Distribution</p>
          <p className="text-slate-500 text-sm">orders@rocketdistro.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-700">INVOICE</h2>
          <p className="text-sm text-slate-500 mt-1">#{order.order_number}</p>
          <p className="text-sm text-slate-500">{format(new Date(order.created_at), "MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Bill To</p>
          <p className="font-semibold">{order.customer_name}</p>
          <p className="text-sm text-slate-600">{order.customer_phone}</p>
          <p className="text-sm text-slate-600">{order.customer_email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Order Info</p>
          <p className="text-sm"><span className="text-slate-400">Status:</span> <span className="font-medium capitalize">{order.status}</span></p>
          <p className="text-sm"><span className="text-slate-400">Date:</span> {format(new Date(order.created_at), "MMM d, yyyy")}</p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
            <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Product</th>
            <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">SKU</th>
            <th className="text-center py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</th>
            <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Unit Price</th>
            <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td className="py-2.5 text-sm">{item.product_name}</td>
              <td className="py-2.5 text-xs font-mono text-slate-500">{item.product_sku ?? "—"}</td>
              <td className="py-2.5 text-sm text-center">{item.quantity}</td>
              <td className="py-2.5 text-sm text-right font-mono">${Number(item.price).toFixed(2)}</td>
              <td className="py-2.5 text-sm text-right font-mono font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: "2px solid #e2e8f0" }}>
            <td colSpan={4} className="py-3 text-right font-semibold text-slate-700">Total</td>
            <td className="py-3 text-right font-bold text-lg font-mono">${subtotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {order.notes && (
        <div className="mb-8 p-4 rounded-lg bg-slate-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
          <p className="text-sm text-slate-700">{order.notes}</p>
        </div>
      )}

      <div className="text-center pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">Thank you for your business!</p>
        <p className="text-xs text-slate-400 mt-1">Questions? Contact orders@rocketdistro.com</p>
      </div>
    </div>
  );
}
