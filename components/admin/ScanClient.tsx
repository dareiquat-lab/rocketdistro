"use client";

import { useState, useRef, useEffect } from "react";
import { ScanLine, Search, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

export function ScanClient() {
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/barcode/${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const p = await res.json();
        setProduct(p);
        setHistory(prev => [p, ...prev.filter(h => h.id !== p.id)].slice(0, 10));
      } else {
        setError("Product not found");
        setProduct(null);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setQuery("");
      inputRef.current?.focus();
    }
  };

  const adjustQty = async (delta: number) => {
    if (!product) return;
    const newQty = Math.max(0, product.quantity + delta);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });
    if (res.ok) {
      const updated = { ...product, quantity: newQty };
      setProduct(updated);
      setHistory(prev => prev.map(h => h.id === product.id ? updated : h));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Scan form */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>
            <ScanLine size={20} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Barcode / SKU Scanner</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Scan a barcode or enter SKU manually</p>
          </div>
        </div>
        <form onSubmit={handleScan} className="flex gap-2">
          <input
            ref={inputRef}
            className="input-field flex-1"
            placeholder="Scan barcode or type SKU…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Search size={14} /> {loading ? "…" : "Look Up"}
          </button>
        </form>
        {error && <p className="text-sm mt-2" style={{ color: "var(--danger)" }}>{error}</p>}
      </div>

      {/* Product card */}
      {product && (
        <div className="card space-y-4">
          <div className="flex gap-4">
            {product.image_url ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={product.image_url} alt={product.product_name} fill className="object-cover" sizes="80px" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "var(--muted)" }}>📦</div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg" style={{ color: "var(--text)" }}>{product.product_name}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{product.category}</p>
              <p className="font-mono text-xs mt-1" style={{ color: "var(--text-dim)" }}>{product.sku}</p>
              <p className="text-xl font-bold mt-2" style={{ color: "var(--accent)" }}>${Number(product.price).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Quantity:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => adjustQty(-1)} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "var(--muted)", color: "var(--text)" }}>−</button>
              <span className="text-xl font-bold font-mono w-12 text-center" style={{ color: "var(--text)" }}>{product.quantity}</span>
              <button onClick={() => adjustQty(1)} className="w-8 h-8 rounded-lg text-lg font-bold" style={{ background: "var(--muted)", color: "var(--text)" }}>+</button>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/admin/products/${product.id}`} className="btn-secondary flex-1 justify-center">
              Edit Product
            </Link>
            <Link
              href={`/admin/orders?prefill=${encodeURIComponent(JSON.stringify({ product_id: product.id, product_name: product.product_name, sku: product.sku, price: product.price }))}`}
              className="btn-primary flex-1 justify-center"
            >
              <Plus size={14} /> Create Order
            </Link>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>Recent Scans</h3>
          <div className="space-y-2">
            {history.map(p => (
              <button
                key={p.id}
                onClick={() => setProduct(p)}
                className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <span className="text-lg">📦</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{p.product_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.sku} · Qty: {p.quantity}</p>
                </div>
                <span className="text-sm font-mono" style={{ color: "var(--accent)" }}>${Number(p.price).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
