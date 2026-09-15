"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Minus, X, ChevronLeft, ChevronRight,
  User, Package, ShoppingCart, FileText, Tag,
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
  return <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(22,163,74,0.12)", color: "var(--success)" }}>{qty} in stock</span>;
}

export function CreateOrderClient() {
  const router = useRouter();

  // ── Products panel ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productPages, setProductPages] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ── Order panel ─────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [clientType, setClientType] = useState("Retailer");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const orderPanelRef = useRef<HTMLDivElement>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(productSearch); setProductPage(1); }, 350);
    return () => clearTimeout(t);
  }, [productSearch]);

  // fetch brands
  useEffect(() => {
    fetch("/api/admin/brands").then(r => r.ok ? r.json() : []).then(setBrands).catch(() => {});
  }, []);

  // fetch products
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
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.product_id !== productId));
    } else {
      setCart(prev => prev.map(c => c.product_id === productId ? { ...c, quantity: qty } : c));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(c => c.product_id !== productId));
  };

  const updateItemPrice = (productId: number, price: number) => {
    setCart(prev => prev.map(c => c.product_id === productId ? { ...c, price } : c));
  };

  const addCustomItem = () => {
    const tempId = -Date.now();
    setCart(prev => [...prev, {
      product_id: tempId,
      product_name: "",
      product_sku: null,
      quantity: 1,
      price: 0,
      cost: 0,
      image_url: null,
    }]);
  };

  const updateCustomItem = (productId: number, field: "product_name" | "product_sku" | "price" | "quantity", value: string | number) => {
    setCart(prev => prev.map(c => c.product_id === productId ? { ...c, [field]: value } : c));
  };

  const orderTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleClientSelect = (client: Client) => {
    setCustomerName(client.contact_name ?? client.business_name);
    setCustomerPhone(client.phone ?? "");
    setCustomerEmail(client.email ?? "");
    setBusinessName(client.business_name);
    setClientType(client.client_type);
  };

  const canSubmit = customerName && customerPhone && customerEmail && cart.length > 0;

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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Left: Product catalog ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-r" style={{ borderColor: "var(--border)" }}>
        {/* Catalog toolbar */}
        <div className="p-4 space-y-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Link href="/admin/orders" className="p-1.5 rounded-lg hover:opacity-70 flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
              <ChevronLeft size={16} /> Orders
            </Link>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
              <input
                className="input-field pl-8"
                placeholder="Search products…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field"
              style={{ width: "auto", minWidth: "130px" }}
              value={filterBrand}
              onChange={e => { setFilterBrand(e.target.value); setProductPage(1); }}
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            {productTotal.toLocaleString()} product{productTotal !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-40">
              <p style={{ color: "var(--text-dim)" }}>Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Package size={36} style={{ color: "var(--text-dim)" }} />
              <p style={{ color: "var(--text-muted)" }}>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {products.map(p => {
                const qty = cartQty(p.id);
                const inCart = qty > 0;
                return (
                  <div
                    key={p.id}
                    className="rounded-xl p-3 flex flex-col gap-2 transition-all"
                    style={{
                      background: inCart ? "rgba(var(--accent-rgb, 59,130,246),0.06)" : "var(--surface)",
                      border: `1px solid ${inCart ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {/* Image + info */}
                    <div className="flex gap-2.5">
                      <div className="flex-shrink-0">
                        {p.image_url ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                            <Image src={p.image_url} alt={p.product_name} fill className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl" style={{ background: "var(--muted)" }}>📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate" style={{ color: "var(--text)" }}>{p.product_name}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>{p.sku}</p>
                        {p.brand && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <Tag size={10} />{p.brand}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price + stock */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-mono" style={{ color: "var(--accent)" }}>${Number(p.price).toFixed(2)}</span>
                      <StockBadge qty={p.quantity} />
                    </div>

                    {/* Add / qty stepper */}
                    {inCart ? (
                      <div className="flex items-center gap-1 mt-auto">
                        <button
                          onClick={() => setCartQty(p.id, qty - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold hover:opacity-70"
                          style={{ background: "var(--muted)", color: "var(--text)" }}
                        ><Minus size={12} /></button>
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={e => setCartQty(p.id, parseInt(e.target.value) || 1)}
                          className="flex-1 text-center text-sm font-mono font-semibold rounded-lg h-7 border-0 outline-none"
                          style={{ background: "var(--muted)", color: "var(--text)" }}
                        />
                        <button
                          onClick={() => setCartQty(p.id, qty + 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold hover:opacity-70"
                          style={{ background: "var(--accent)", color: "white" }}
                        ><Plus size={12} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.quantity === 0}
                        className="w-full h-7 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
                        style={{ background: "var(--accent)", color: "white" }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {productPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
            <button className="btn-secondary py-1 px-2.5 text-xs" onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(productPages, 7) }, (_, i) => {
              const p = productPage <= 4 ? i + 1 : productPage + i - 3;
              if (p < 1 || p > productPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setProductPage(p)}
                  className="w-7 h-7 rounded text-xs font-medium"
                  style={{
                    background: p === productPage ? "var(--accent)" : "var(--surface)",
                    color: p === productPage ? "white" : "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                >{p}</button>
              );
            })}
            <button className="btn-secondary py-1 px-2.5 text-xs" onClick={() => setProductPage(p => Math.min(productPages, p + 1))} disabled={productPage === productPages}>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Right: Order summary ──────────────────────────────────────────── */}
      <div
        ref={orderPanelRef}
        className="w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col overflow-y-auto"
        style={{ background: "var(--surface)" }}
      >
        {/* Panel header */}
        <div className="px-5 py-4 border-b flex-shrink-0 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} style={{ color: "var(--accent)" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>Order Summary</span>
          </div>
          {cart.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--accent)", color: "white" }}>
              {cart.reduce((s, c) => s + c.quantity, 0)} items
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-0">

          {/* Customer section */}
          <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <User size={14} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Customer</span>
            </div>
            <ClientPicker onSelect={handleClientSelect} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label text-xs">Name *</label>
                <input
                  className="input-field text-sm"
                  placeholder="Full name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Phone *</label>
                <input
                  className="input-field text-sm"
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Email *</label>
                <input
                  className="input-field text-sm"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Business</label>
                <input
                  className="input-field text-sm"
                  placeholder="Business name"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label text-xs">Client Type</label>
              <select className="input-field text-sm" value={clientType} onChange={e => setClientType(e.target.value)}>
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Items section */}
          <div className="px-5 py-4 flex-1 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: "var(--text-muted)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Items</span>
              </div>
              <button
                type="button"
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:opacity-80"
                style={{ background: "var(--muted)", color: "var(--text-muted)" }}
                onClick={addCustomItem}
              >
                <Plus size={11} /> Custom
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <ShoppingCart size={28} style={{ color: "var(--text-dim)" }} />
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>No items yet</p>
                <p className="text-xs text-center" style={{ color: "var(--text-dim)" }}>Click + Add on a product</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product_id} className="rounded-xl p-2.5 space-y-2" style={{ background: "var(--muted)" }}>
                    <div className="flex items-start gap-2">
                      {item.product_id > 0 ? (
                        <div className="flex-shrink-0 mt-0.5">
                          {item.image_url ? (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                              <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="32px" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: "var(--border)" }}>📦</div>
                          )}
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        {item.product_id < 0 ? (
                          <input
                            className="input-field text-xs py-1 mb-1"
                            placeholder="Product name"
                            value={item.product_name}
                            onChange={e => updateCustomItem(item.product_id, "product_name", e.target.value)}
                            style={{ background: "var(--background)" }}
                          />
                        ) : (
                          <p className="text-xs font-medium leading-tight" style={{ color: "var(--text)" }}>{item.product_name}</p>
                        )}
                        {item.product_sku && (
                          <p className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>{item.product_sku}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 rounded hover:opacity-70 flex-shrink-0"
                        style={{ color: "var(--danger)" }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCartQty(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70"
                          style={{ background: "var(--border)", color: "var(--text)" }}
                        ><Minus size={10} /></button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => setCartQty(item.product_id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center text-xs font-mono rounded border-0 outline-none h-6"
                          style={{ background: "var(--border)", color: "var(--text)" }}
                        />
                        <button
                          onClick={() => setCartQty(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70"
                          style={{ background: "var(--border)", color: "var(--text)" }}
                        ><Plus size={10} /></button>
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>×</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-dim)" }}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={e => updateItemPrice(item.product_id, parseFloat(e.target.value) || 0)}
                          className="input-field pl-5 py-1 text-xs font-mono w-full"
                          style={{ background: "var(--background)" }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes + Total + Submit */}
          <div className="px-5 py-4 space-y-4 flex-shrink-0">
            <div>
              <label className="label text-xs">Order Notes</label>
              <textarea
                className="input-field text-sm"
                rows={2}
                placeholder="Optional notes for this order…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Total */}
            <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--muted)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Order Total</span>
              <span className="text-lg font-bold font-mono" style={{ color: "var(--text)" }}>${orderTotal.toFixed(2)}</span>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(220,38,38,0.1)", color: "var(--danger)" }}>{error}</p>
            )}

            {!canSubmit && (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                {cart.length === 0 ? "Add at least one product to continue." : "Fill in customer name, phone, and email."}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating Order…" : "Create Order"}
            </button>

            <Link
              href="/admin/orders"
              className="w-full text-center block text-sm py-2 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
