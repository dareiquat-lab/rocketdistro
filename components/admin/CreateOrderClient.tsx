"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Minus, X, ChevronLeft, ChevronRight,
  User, ShoppingCart, Mail, Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ClientPicker } from "@/components/admin/ClientPicker";
import type { Product, Brand, Client } from "@/types";
import { CLIENT_TYPES } from "@/types";

interface CartItem {
  product_id: number;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  price: number;
  cost: number;
  image_url: string | null;
}

const LOW = 10;

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(220,38,38,0.12)", color: "var(--danger)" }}>Out</span>;
  if (qty <= LOW) return <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(217,119,6,0.12)", color: "var(--warning)" }}>Low {qty}</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(22,163,74,0.12)", color: "var(--success)" }}>{qty}</span>;
}

export function CreateOrderClient() {
  const router = useRouter();

  // ── Product browser state ────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productPages, setProductPages] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ── Order form state ─────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [clientType, setClientType] = useState("Retailer");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(productSearch); setProductPage(1); }, 350);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    fetch("/api/admin/brands").then(r => r.ok ? r.json() : []).then(setBrands).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        admin: "true", search: debouncedSearch, brand: filterBrand,
        sortBy: "product_name", sortDir: "asc",
        page: String(productPage), limit: "24",
      });
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setProductTotal(data.total ?? 0);
        setProductPages(data.pages ?? 1);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, [debouncedSearch, filterBrand, productPage]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const cartQty = (id: number) => cart.find(c => c.product_id === id)?.quantity ?? 0;

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === p.id);
      if (existing) return prev.map(c => c.product_id === p.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, {
        product_id: p.id,
        product_name: p.product_name,
        product_sku: p.sku,
        quantity: 1,
        price: Number(p.price),
        cost: Number(p.cost),
        image_url: p.image_url,
      }];
    });
  };

  const setCartQty = (productId: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.product_id !== productId));
    else setCart(prev => prev.map(c => c.product_id === productId ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (productId: number) => setCart(prev => prev.filter(c => c.product_id !== productId));
  const updateItemPrice = (productId: number, price: number) =>
    setCart(prev => prev.map(c => c.product_id === productId ? { ...c, price } : c));

  const addCustomItem = () => setCart(prev => [...prev, {
    product_id: -Date.now(),
    product_name: "", product_sku: null,
    quantity: 1, price: 0, cost: 0, image_url: null,
  }]);

  const updateCustomItem = (productId: number, field: "product_name" | "product_sku" | "price" | "quantity", value: string | number) =>
    setCart(prev => prev.map(c => c.product_id === productId ? { ...c, [field]: value } : c));

  const orderTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleClientSelect = (client: Client) => {
    setCustomerName(client.contact_name ?? client.business_name);
    setCustomerPhone(client.phone ?? "");
    if (client.email) { setCustomerEmail(client.email); setShowEmail(true); }
    setBusinessName(client.business_name);
    setClientType(client.client_type);
  };

  const canSubmit = customerName.trim() && customerPhone.trim() && cart.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        business_name: businessName,
        client_type: clientType,
        notes,
        items: cart.map(c => ({
          product_id: c.product_id > 0 ? c.product_id : null,
          product_name: c.product_name,
          product_sku: c.product_sku,
          quantity: c.quantity,
          price: c.price,
          cost: c.cost,
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const order = await res.json();
        router.push(`/admin/orders?highlight=${order.id}`);
      } else {
        const err = await res.json();
        setError(err.error ?? "Failed to create order");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-y-auto h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Back nav */}
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
          <ChevronLeft size={15} /> Back to Orders
        </Link>

        {/* ── Customer ──────────────────────────────────────────────────────── */}
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
              <input className="input-field" placeholder="Full name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input-field" placeholder="Phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Business Name</label>
              <input className="input-field" placeholder="Optional" value={businessName} onChange={e => setBusinessName(e.target.value)} />
            </div>
            <div>
              <label className="label">Client Type</label>
              <select className="input-field" value={clientType} onChange={e => setClientType(e.target.value)}>
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {showEmail ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Email</label>
                <button type="button" onClick={() => { setShowEmail(false); setCustomerEmail(""); }} className="text-xs flex items-center gap-1 hover:opacity-70" style={{ color: "var(--text-dim)" }}>
                  <X size={11} /> Remove
                </button>
              </div>
              <input className="input-field" type="email" placeholder="customer@example.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} autoFocus />
            </div>
          ) : (
            <button type="button" onClick={() => setShowEmail(true)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:opacity-80" style={{ background: "var(--muted)", color: "var(--text-muted)" }}>
              <Mail size={13} /> Add Email
            </button>
          )}
        </div>

        {/* ── Items ─────────────────────────────────────────────────────────── */}
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

          {/* ── Product browser ─────────────────────────────────────────────── */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>

            {/* Search bar */}
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
                <input
                  className="input-field pl-8 text-sm py-1.5 w-full"
                  placeholder="Search products by name or SKU…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ background: "var(--surface)" }}
                />
              </div>
            </div>

            <div className="flex" style={{ minHeight: "320px", maxHeight: "400px" }}>

              {/* Brand sidebar */}
              <div className="flex-shrink-0 border-r overflow-y-auto" style={{ width: "140px", borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setFilterBrand(""); setProductPage(1); }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    style={{
                      background: filterBrand === "" ? "var(--accent)" : "transparent",
                      color: filterBrand === "" ? "white" : "var(--text-muted)",
                    }}
                  >
                    <Tag size={11} /> All Brands
                  </button>
                  {brands.map(b => (
                    <button
                      key={b.id}
                      onClick={() => { setFilterBrand(b.name); setProductPage(1); }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors truncate"
                      style={{
                        background: filterBrand === b.name ? "var(--accent)" : "transparent",
                        color: filterBrand === b.name ? "white" : "var(--text-muted)",
                      }}
                      title={b.name}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product grid */}
              <div className="flex-1 overflow-y-auto p-3" style={{ background: "var(--background)" }}>
                {loadingProducts ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: "var(--text-dim)" }}>Loading…</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 xl:grid-cols-4 gap-2">
                    {products.map(p => {
                      const qty = cartQty(p.id);
                      const inCart = qty > 0;
                      return (
                        <div
                          key={p.id}
                          className="rounded-xl p-2.5 flex flex-col gap-2 transition-all"
                          style={{
                            background: inCart ? "rgba(59,130,246,0.06)" : "var(--surface)",
                            border: `1px solid ${inCart ? "var(--accent)" : "var(--border)"}`,
                          }}
                        >
                          {/* Image */}
                          <div className="flex justify-center">
                            {p.image_url ? (
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                                <Image src={p.image_url} alt={p.product_name} fill className="object-cover" sizes="56px" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl" style={{ background: "var(--muted)" }}>📦</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: "var(--text)" }}>{p.product_name}</p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>{p.sku}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold font-mono" style={{ color: "var(--accent)" }}>${Number(p.price).toFixed(2)}</span>
                              <StockBadge qty={p.quantity} />
                            </div>
                          </div>

                          {/* Add / stepper */}
                          {inCart ? (
                            <div className="flex items-center gap-1 mt-auto">
                              <button
                                onClick={() => setCartQty(p.id, qty - 1)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70"
                                style={{ background: "var(--muted)", color: "var(--text)" }}
                              ><Minus size={10} /></button>
                              <span className="flex-1 text-center text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>{qty}</span>
                              <button
                                onClick={() => addToCart(p)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70"
                                style={{ background: "var(--accent)", color: "white" }}
                              ><Plus size={10} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(p)}
                              disabled={p.quantity === 0}
                              className="w-full h-7 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity mt-auto"
                              style={{ background: "var(--accent)", color: "white" }}
                            >
                              <Plus size={11} /> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {productPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                <button
                  className="btn-secondary py-1 px-2.5 text-xs"
                  onClick={() => setProductPage(p => Math.max(1, p - 1))}
                  disabled={productPage === 1}
                ><ChevronLeft size={12} /></button>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {productTotal} products · page {productPage} of {productPages}
                </span>
                <button
                  className="btn-secondary py-1 px-2.5 text-xs"
                  onClick={() => setProductPage(p => Math.min(productPages, p + 1))}
                  disabled={productPage === productPages}
                ><ChevronRight size={12} /></button>
              </div>
            )}
          </div>

          {/* ── Added items table ────────────────────────────────────────────── */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Added Items</p>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {cart.reduce((s, c) => s + c.quantity, 0)} units
                </p>
              </div>
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
                    {cart.map(item => (
                      <tr key={item.product_id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            {item.product_id > 0 && (
                              item.image_url ? (
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="36px" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "var(--muted)" }}>📦</div>
                              )
                            )}
                            <div className="min-w-0 flex-1">
                              {item.product_id < 0 ? (
                                <input
                                  className="input-field text-sm py-1"
                                  placeholder="Product name"
                                  value={item.product_name}
                                  onChange={e => updateCustomItem(item.product_id, "product_name", e.target.value)}
                                />
                              ) : (
                                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{item.product_name}</p>
                              )}
                              {item.product_sku && (
                                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>{item.product_sku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setCartQty(item.product_id, item.quantity - 1)} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70" style={{ background: "var(--muted)", color: "var(--text)" }}><Minus size={10} /></button>
                            <input
                              type="number" min="1" value={item.quantity}
                              onChange={e => setCartQty(item.product_id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center text-sm font-mono rounded-lg border-0 outline-none h-6"
                              style={{ background: "var(--muted)", color: "var(--text)" }}
                            />
                            <button onClick={() => setCartQty(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70" style={{ background: "var(--muted)", color: "var(--text)" }}><Plus size={10} /></button>
                          </div>
                        </td>
                        <td>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-dim)" }}>$</span>
                            <input
                              type="number" min="0" step="0.01" value={item.price}
                              onChange={e => updateItemPrice(item.product_id, parseFloat(e.target.value) || 0)}
                              className="input-field pl-5 py-1 text-sm font-mono w-full"
                            />
                          </div>
                        </td>
                        <td className="text-right font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td>
                          <button onClick={() => removeFromCart(item.product_id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}><X size={13} /></button>
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
          )}
        </div>

        {/* ── Notes ─────────────────────────────────────────────────────────── */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Order Notes</h2>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Optional notes, special instructions, delivery info…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-8">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="btn-primary px-8 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Creating Order…" : "Create Order"}
          </button>
          <Link href="/admin/orders" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Cancel
          </Link>
          {!canSubmit && (
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              {cart.length === 0 ? "Add at least one item" : "Name and phone are required"}
            </span>
          )}
          {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
        </div>

      </div>
    </div>
  );
}
