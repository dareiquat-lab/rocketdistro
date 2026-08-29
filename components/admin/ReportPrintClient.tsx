"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import type { Order, Product } from "@/types";

interface StatusBreakdown {
  status: string;
  count: number;
  total_value: number;
}

interface ReportData {
  orders: Order[];
  products: Product[];
  statusBreakdown: StatusBreakdown[];
  lowStock: Product[];
}

interface ReportPrintClientProps {
  data: ReportData;
}

export function ReportPrintClient({ data }: ReportPrintClientProps) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  const now = new Date();
  const monthYear = format(now, "MMMM yyyy");
  const totalOrderValue = data.orders.reduce((s, o) => {
    const items = o.items ?? [];
    return s + items.reduce((is, i) => is + Number(i.price) * i.quantity, 0);
  }, 0);

  const categoryTotals = data.products.reduce<Record<string, { count: number; value: number }>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = { count: 0, value: 0 };
    acc[p.category].count++;
    acc[p.category].value += Number(p.price) * p.quantity;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white text-slate-900 min-h-screen text-sm">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print mb-6 flex justify-end">
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#2563eb" }}>
          Print Report
        </button>
      </div>

      <div className="text-center mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-blue-600">🚀 ROCKET DISTRO — Monthly Report</h1>
        <p className="text-slate-500 mt-1">{monthYear} · Generated {format(now, "MMM d, yyyy h:mm a")}</p>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3 text-slate-700">Order Summary</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded border border-slate-200">
            <p className="text-xs text-slate-400">Total Order Value</p>
            <p className="text-xl font-bold">${totalOrderValue.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded border border-slate-200">
            <p className="text-xs text-slate-400">Total Orders</p>
            <p className="text-xl font-bold">{data.orders.length}</p>
          </div>
        </div>
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <th className="text-left py-1.5 text-xs uppercase text-slate-400">Status</th>
              <th className="text-right py-1.5 text-xs uppercase text-slate-400">Count</th>
              <th className="text-right py-1.5 text-xs uppercase text-slate-400">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.statusBreakdown.map(s => (
              <tr key={s.status} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td className="py-1.5 capitalize">{s.status}</td>
                <td className="py-1.5 text-right">{s.count}</td>
                <td className="py-1.5 text-right font-mono">${Number(s.total_value).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Orders table */}
      {data.orders.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-base mb-3 text-slate-700">This Month&apos;s Orders</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className="text-left py-1.5 text-slate-400">Order #</th>
                <th className="text-left py-1.5 text-slate-400">Customer</th>
                <th className="text-center py-1.5 text-slate-400">Status</th>
                <th className="text-right py-1.5 text-slate-400">Total</th>
                <th className="text-right py-1.5 text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map(o => {
                const items = o.items ?? [];
                const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="py-1.5 font-mono">{o.order_number}</td>
                    <td className="py-1.5">{o.customer_name}</td>
                    <td className="py-1.5 text-center capitalize">{o.status}</td>
                    <td className="py-1.5 text-right font-mono">${total.toFixed(2)}</td>
                    <td className="py-1.5 text-right">{format(new Date(o.created_at), "MMM d")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Category totals */}
      <div className="mb-6">
        <h2 className="font-bold text-base mb-3 text-slate-700">Inventory by Category</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <th className="text-left py-1.5 text-slate-400">Category</th>
              <th className="text-right py-1.5 text-slate-400">Products</th>
              <th className="text-right py-1.5 text-slate-400">Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryTotals).map(([cat, info]) => (
              <tr key={cat} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td className="py-1.5">{cat}</td>
                <td className="py-1.5 text-right">{info.count}</td>
                <td className="py-1.5 text-right font-mono">${info.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Low stock */}
      {data.lowStock.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-base mb-3 text-orange-600">⚠ Low Stock Alerts ({data.lowStock.length})</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className="text-left py-1.5 text-slate-400">Product</th>
                <th className="text-left py-1.5 text-slate-400">SKU</th>
                <th className="text-right py-1.5 text-slate-400">Qty</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="py-1.5">{p.product_name}</td>
                  <td className="py-1.5 font-mono">{p.sku}</td>
                  <td className="py-1.5 text-right font-bold text-orange-600">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
