"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Edit } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types";

export function LowStockClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLow = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?admin=true&lowStock=true&limit=100");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLow(); }, []);

  const adjustQty = async (id: number, delta: number, current: number) => {
    const newQty = Math.max(0, current + delta);
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    if (res.ok) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: newQty } : p));
    }
  };

  return (
    <div className="p-6 space-y-4">
      {loading ? (
        <p style={{ color: "var(--text-dim)" }}>Loading…</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(22,163,74,0.1)" }}>
            <AlertTriangle size={32} style={{ color: "var(--success)" }} />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>All stocked up!</h2>
          <p style={{ color: "var(--text-muted)" }}>No products are running low on stock.</p>
        </div>
      ) : (
        <>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {products.length} product{products.length !== 1 ? "s" : ""} need restocking
          </p>
          <div className="table-container">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderLeft: "3px solid var(--warning)" }}>
                    <td className="font-medium" style={{ color: "var(--text)" }}>{p.product_name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{p.category}</td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{p.sku}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjustQty(p.id, -1, p.quantity)} className="w-6 h-6 rounded text-sm font-bold hover:opacity-70" style={{ background: "var(--muted)", color: "var(--text)" }}>−</button>
                        <span className="w-8 text-center font-mono font-semibold text-sm" style={{ color: "var(--warning)" }}>{p.quantity}</span>
                        <button onClick={() => adjustQty(p.id, 1, p.quantity)} className="w-6 h-6 rounded text-sm font-bold hover:opacity-70" style={{ background: "var(--muted)", color: "var(--text)" }}>+</button>
                      </div>
                    </td>
                    <td className="font-mono text-sm">${Number(p.price).toFixed(2)}</td>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="btn-secondary py-1 px-2 text-xs">
                        <Edit size={12} /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
