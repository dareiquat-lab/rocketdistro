"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, Edit, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Product, CategoryRecord } from "@/types";

const LOW_STOCK_THRESHOLD = 10;

export function InventoryClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        admin: "true", search: debouncedSearch, category,
        sortBy, sortDir, page: String(page), limit: "25",
      });
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
  }, [debouncedSearch, category, sortBy, sortDir, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []));
  }, []);

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return null;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchProducts();
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await fetch("/api/products/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setBulkDeleteOpen(false);
      fetchProducts();
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = products.length > 0 && products.every(p => selected.has(p.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map(p => p.id)));
  };

  const margin = (p: Product) => {
    if (!p.price || !p.cost) return null;
    return Math.round(((p.price - p.cost) / p.price) * 100);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
          <input
            className="input-field pl-8"
            placeholder="Search name, SKU, category, barcode…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-field w-full sm:w-44"
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button className="btn-danger" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={14} /> Delete ({selected.size})
            </button>
          )}
          <a href="/api/export?format=csv" className="btn-secondary">Export</a>
          <Link href="/admin/products/new" className="btn-primary">
            <Plus size={14} /> Add Product
          </Link>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
        {total.toLocaleString()} product{total !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-10"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th className="w-12">Image</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("product_name")}>
                <span className="flex items-center gap-1">Name <SortIcon col="product_name" /></span>
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("category")}>
                <span className="flex items-center gap-1">Category <SortIcon col="category" /></span>
              </th>
              <th>Brand</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("quantity")}>
                <span className="flex items-center gap-1">Qty <SortIcon col="quantity" /></span>
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("price")}>
                <span className="flex items-center gap-1">Price <SortIcon col="price" /></span>
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("cost")}>
                <span className="flex items-center gap-1">Cost <SortIcon col="cost" /></span>
              </th>
              <th>Margin</th>
              <th>Barcode</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="py-12 text-center" style={{ color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center">
                  <Package size={40} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
                  <p style={{ color: "var(--text-muted)" }}>No products found</p>
                </td>
              </tr>
            ) : products.map(p => (
              <tr
                key={p.id}
                style={{
                  borderLeft: p.quantity <= LOW_STOCK_THRESHOLD ? "3px solid var(--warning)" : undefined,
                }}
              >
                <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                <td>
                  {p.image_url ? (
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden">
                      <Image src={p.image_url} alt={p.product_name} fill className="object-cover" sizes="36px" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--muted)" }}>📦</div>
                  )}
                </td>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline" style={{ color: "var(--text)" }}>
                    {p.product_name}
                  </Link>
                </td>
                <td>
                  <Badge variant="default">{p.category}</Badge>
                </td>
                <td>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{p.brand ?? "—"}</span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustQty(p.id, -1, p.quantity)}
                      className="w-6 h-6 rounded flex items-center justify-center text-lg font-bold hover:opacity-70"
                      style={{ background: "var(--muted)", color: "var(--text)" }}
                    >−</button>
                    <span
                      className="w-8 text-center text-sm font-mono font-semibold"
                      style={{ color: p.quantity <= LOW_STOCK_THRESHOLD ? "var(--warning)" : "var(--text)" }}
                    >
                      {p.quantity}
                    </span>
                    <button
                      onClick={() => adjustQty(p.id, 1, p.quantity)}
                      className="w-6 h-6 rounded flex items-center justify-center text-lg font-bold hover:opacity-70"
                      style={{ background: "var(--muted)", color: "var(--text)" }}
                    >+</button>
                  </div>
                </td>
                <td className="font-mono text-sm">${Number(p.price).toFixed(2)}</td>
                <td className="font-mono text-sm">${Number(p.cost).toFixed(2)}</td>
                <td>
                  {margin(p) !== null ? (
                    <Badge variant={margin(p)! > 20 ? "success" : margin(p)! > 0 ? "warning" : "danger"}>
                      {margin(p)}%
                    </Badge>
                  ) : "—"}
                </td>
                <td className="font-mono text-xs" style={{ color: "var(--text-dim)" }}>{p.barcode ?? "—"}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/products/${p.id}`} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--accent)" }} title="Edit">
                      <Edit size={14} />
                    </Link>
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page + i - 3;
            if (p < 1 || p > pages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded text-sm font-medium"
                style={{
                  background: p === page ? "var(--accent)" : "var(--surface)",
                  color: p === page ? "white" : "var(--text)",
                  border: "1px solid var(--border)",
                }}
              >{p}</button>
            );
          })}
          <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Delete Modals */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Product" size="sm">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Are you sure? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>

      <Modal open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Delete Selected" size="sm">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Delete {selected.size} product{selected.size !== 1 ? "s" : ""}? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={() => setBulkDeleteOpen(false)}>Cancel</button>
          <button className="btn-danger" onClick={handleBulkDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete All"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
