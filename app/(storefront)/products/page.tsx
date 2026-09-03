"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { OrderForm } from "@/components/storefront/OrderForm";
import { useCart } from "@/components/storefront/CartContext";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { count } = useCart();
  const [products, setProducts] = useState<Parameters<typeof ProductCard>[0]["product"][]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; icon: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category, brand, page: String(page), limit: "24" });
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [search, category, brand, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.ok ? r.json() : []).then(data => {
      setCategories(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Products</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
        <input
          className="input-field pl-9 max-w-md"
          placeholder="Search products…"
          value={search}
          onChange={e => setParam("search", e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setParam("category", "")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: !category ? "var(--accent)" : "var(--surface)", color: !category ? "white" : "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setParam("category", cat.name)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: category === cat.name ? "var(--accent)" : "var(--surface)", color: category === cat.name ? "white" : "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>{total.toLocaleString()} product{total !== 1 ? "s" : ""}</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl aspect-square animate-pulse" style={{ background: "var(--muted)" }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📦</p>
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page + i - 3;
            if (p < 1 || p > pages) return null;
            return (
              <button
                key={p}
                onClick={() => setParam("page", String(p))}
                className="w-9 h-9 rounded-lg text-sm font-medium"
                style={{ background: p === page ? "var(--accent)" : "var(--surface)", color: p === page ? "white" : "var(--text)", border: "1px solid var(--border)" }}
              >{p}</button>
            );
          })}
        </div>
      )}

      {/* Order form when cart has items */}
      {count > 0 && (
        <div className="mt-16">
          <OrderForm />
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
