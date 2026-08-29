"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, Eye, Printer, Mail, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ClientPicker } from "@/components/admin/ClientPicker";
import { EmailInvoiceModal } from "@/components/admin/EmailInvoiceModal";
import type { Order, OrderItem, Client, Product, CategoryRecord } from "@/types";
import { ORDER_STATUSES, CLIENT_TYPES } from "@/types";

const STATUS_BADGE: Record<string, "info" | "purple" | "warning" | "success" | "danger"> = {
  new: "info", contacted: "purple", ready: "warning", completed: "success", cancelled: "danger",
};

interface OrderFormItem {
  product_id: number | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  price: number;
  cost: number;
}

interface OrderFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  business_name: string;
  tobacco_license_number: string;
  sellers_permit_number: string;
  client_type: string;
  notes: string;
  items: OrderFormItem[];
}

const emptyForm = (): OrderFormData => ({
  customer_name: "", customer_phone: "", customer_email: "",
  business_name: "", tobacco_license_number: "", sellers_permit_number: "",
  client_type: "Retailer", notes: "", items: [],
});

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderFormData>(emptyForm());
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [emailOrder, setEmailOrder] = useState<Order | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: debouncedSearch, status, page: String(page), limit: "25" });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const searchProducts = async (q: string) => {
    if (!q || q.length < 2) { setProductResults([]); return; }
    const res = await fetch(`/api/products?admin=true&search=${encodeURIComponent(q)}&limit=10`);
    if (res.ok) {
      const data = await res.json();
      setProductResults(data.products ?? []);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addProduct = (p: Product) => {
    setForm(f => ({
      ...f,
      items: [...f.items, {
        product_id: p.id,
        product_name: p.product_name,
        product_sku: p.sku,
        quantity: 1,
        price: Number(p.price),
        cost: Number(p.cost),
      }],
    }));
    setProductSearch("");
    setProductResults([]);
  };

  const addCustomItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { product_id: null, product_name: "", product_sku: null, quantity: 1, price: 0, cost: 0 }],
    }));
  };

  const removeItem = (i: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  };

  const updateItem = (i: number, field: keyof OrderFormItem, value: string | number) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item),
    }));
  };

  const orderTotal = (items: OrderFormItem[]) =>
    items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);

  const openCreate = () => {
    setEditingOrder(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      business_name: "",
      tobacco_license_number: "",
      sellers_permit_number: "",
      client_type: "Retailer",
      notes: order.notes ?? "",
      items: (order.items ?? []).map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_sku: i.product_sku,
        quantity: i.quantity,
        price: Number(i.price),
        cost: Number(i.cost),
      })),
    });
    setFormOpen(true);
  };

  const handleClientSelect = (client: Client) => {
    setForm(f => ({
      ...f,
      customer_name: client.contact_name ?? client.business_name,
      customer_phone: client.phone ?? "",
      customer_email: client.email ?? "",
      business_name: client.business_name,
      tobacco_license_number: client.tobacco_license_number ?? "",
      sellers_permit_number: client.sellers_permit_number ?? "",
      client_type: client.client_type,
    }));
  };

  const handleSave = async () => {
    if (!form.customer_name || !form.customer_phone || !form.customer_email || form.items.length === 0) return;
    setSaving(true);
    try {
      const body = { ...form };
      const res = editingOrder
        ? await fetch(`/api/admin/orders/${editingOrder.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        setFormOpen(false);
        fetchOrders();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as Order["status"] } : o));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/orders/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchOrders();
    } finally {
      setDeleting(false);
    }
  };

  const itemTotal = (items: OrderItem[]) => items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
          <input className="input-field pl-8" placeholder="Search orders…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={14} /> New Order</button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {[{ value: "", label: "All" }, ...ORDER_STATUSES].map(s => (
          <button
            key={s.value}
            onClick={() => { setStatus(s.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: status === s.value ? "var(--accent)" : "var(--surface)",
              color: status === s.value ? "white" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-dim)" }}>{total.toLocaleString()} order{total !== 1 ? "s" : ""}</p>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center" style={{ color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
                  <p style={{ color: "var(--text-muted)" }}>No orders found</p>
                </td>
              </tr>
            ) : orders.map(order => (
              <>
                <tr key={order.id}>
                  <td>
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="font-mono text-sm font-semibold hover:underline flex items-center gap-1"
                      style={{ color: "var(--accent)" }}
                    >
                      {order.order_number}
                      {expandedId === order.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </td>
                  <td>
                    <p className="font-medium" style={{ color: "var(--text)" }}>{order.customer_name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.customer_phone}</p>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {(order.items ?? []).length} item{(order.items ?? []).length !== 1 ? "s" : ""}
                  </td>
                  <td className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
                    ${itemTotal(order.items ?? []).toFixed(2)}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-md font-medium border-0 cursor-pointer"
                      style={{
                        background: ORDER_STATUSES.find(s => s.value === order.status)?.color + "20",
                        color: ORDER_STATUSES.find(s => s.value === order.status)?.color,
                      }}
                    >
                      {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {format(new Date(order.created_at), "MMM d, yyyy")}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(order)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--accent)" }} title="Edit"><Eye size={14} /></button>
                      <a href={`/admin/orders/${order.id}/invoice`} target="_blank" className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Invoice"><Printer size={14} /></a>
                      <button onClick={() => setEmailOrder(order)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Email"><Mail size={14} /></button>
                      <button onClick={() => setDeleteId(order.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {expandedId === order.id && (
                  <tr key={`${order.id}-expand`}>
                    <td colSpan={7} className="px-4 py-3" style={{ background: "var(--muted)" }}>
                      <div className="space-y-1">
                        {(order.items ?? []).map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span style={{ color: "var(--text)" }}>{item.product_name} <span className="font-mono text-xs" style={{ color: "var(--text-dim)" }}>×{item.quantity}</span></span>
                            <span className="font-mono" style={{ color: "var(--text-muted)" }}>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.notes && <p className="text-xs mt-2 italic" style={{ color: "var(--text-dim)" }}>Notes: {order.notes}</p>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page + i - 3;
            if (p < 1 || p > pages) return null;
            return (
              <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded text-sm font-medium" style={{ background: p === page ? "var(--accent)" : "var(--surface)", color: p === page ? "white" : "var(--text)", border: "1px solid var(--border)" }}>{p}</button>
            );
          })}
          <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingOrder ? `Edit ${editingOrder.order_number}` : "New Order"} size="2xl">
        <div className="space-y-5">
          <ClientPicker onSelect={handleClientSelect} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Customer Name *</label><input className="input-field" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
            <div><label className="label">Phone *</label><input className="input-field" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} /></div>
            <div><label className="label">Email *</label><input className="input-field" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} /></div>
            <div><label className="label">Business Name</label><input className="input-field" value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} /></div>
            <div><label className="label">Tobacco License #</label><input className="input-field" value={form.tobacco_license_number} onChange={e => setForm(f => ({ ...f, tobacco_license_number: e.target.value }))} /></div>
            <div><label className="label">Seller's Permit #</label><input className="input-field" value={form.sellers_permit_number} onChange={e => setForm(f => ({ ...f, sellers_permit_number: e.target.value }))} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items</label>
              <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={addCustomItem}>+ Custom Item</button>
            </div>
            {/* Product search */}
            <div className="relative mb-3">
              <input className="input-field" placeholder="Search products to add…" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              {productResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  {productResults.map(p => (
                    <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors">
                      <span style={{ color: "var(--text)" }}>{p.product_name} <span className="font-mono text-xs" style={{ color: "var(--text-dim)" }}>{p.sku}</span></span>
                      <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>${Number(p.price).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Item list */}
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                  <input className="input-field flex-1 min-w-0" placeholder="Product name" value={item.product_name} onChange={e => updateItem(i, "product_name", e.target.value)} style={{ background: "var(--background)" }} />
                  <input className="input-field w-16" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} style={{ background: "var(--background)" }} />
                  <input className="input-field w-24" type="number" step="0.01" placeholder="Price" value={item.price} onChange={e => updateItem(i, "price", parseFloat(e.target.value) || 0)} style={{ background: "var(--background)" }} />
                  <button type="button" onClick={() => removeItem(i)} style={{ color: "var(--danger)" }} className="p-1 hover:opacity-70">✕</button>
                </div>
              ))}
            </div>
            {form.items.length > 0 && (
              <p className="text-right text-sm font-semibold mt-2" style={{ color: "var(--text)" }}>
                Total: ${orderTotal(form.items).toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.customer_name || !form.customer_phone || !form.customer_email || form.items.length === 0}>
              {saving ? "Saving…" : editingOrder ? "Save Changes" : "Create Order"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Order" size="sm">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Delete this order? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
        </div>
      </Modal>

      {/* Email Invoice Modal */}
      {emailOrder && (
        <EmailInvoiceModal
          order={emailOrder}
          onClose={() => setEmailOrder(null)}
        />
      )}
    </div>
  );
}
