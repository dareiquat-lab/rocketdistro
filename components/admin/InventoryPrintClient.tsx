"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import type { Product } from "@/types";

interface InventoryPrintClientProps {
  products: Product[];
  brand?: string;
}

export function InventoryPrintClient({ products, brand }: InventoryPrintClientProps) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  const now = new Date();

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-slate-900 min-h-screen text-sm">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print mb-6 flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-white text-sm"
          style={{ background: "#2563eb" }}
        >
          Save as PDF
        </button>
      </div>

      <div className="text-center mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-blue-600">🚀 ROCKET DISTRO — Product List</h1>
        {brand && <p className="text-slate-600 font-semibold mt-1">{brand}</p>}
        <p className="text-slate-500 mt-1">Generated {format(now, "MMM d, yyyy h:mm a")} · {products.length} product{products.length !== 1 ? "s" : ""}</p>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
            <th className="text-left py-2 pr-3 text-slate-500 uppercase font-semibold">Product Name</th>
            <th className="text-left py-2 pr-3 text-slate-500 uppercase font-semibold">SKU</th>
            {!brand && <th className="text-left py-2 pr-3 text-slate-500 uppercase font-semibold">Brand</th>}
            <th className="text-right py-2 pr-3 text-slate-500 uppercase font-semibold">Qty</th>
            <th className="text-left py-2 text-slate-500 uppercase font-semibold">Barcode</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td className="py-1.5 pr-3 font-medium">{p.product_name}</td>
              <td className="py-1.5 pr-3 font-mono text-slate-600">{p.sku}</td>
              {!brand && <td className="py-1.5 pr-3 text-slate-500">{p.brand ?? "—"}</td>}
              <td className="py-1.5 pr-3 text-right font-mono font-semibold">{p.quantity}</td>
              <td className="py-1.5 font-mono text-slate-400">{p.barcode ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
