"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, Eye, Printer, Mail, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { EmailInvoiceModal } from "@/components/admin/EmailInvoiceModal";
import type { Order, OrderItem } from "@/types";
import { ORDER_STATUSES } from "@/types";

export function OrdersClient({ staffMode = false }: { staffMode?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
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

  const invoiceBase = staffMode ? "/staff/orders" : "/admin/orders";
  const editBase = staffMode ? "/staff/orders" : "/admin/orders";
  const newOrderHref = staffMode ? "/staff/orders/new" : "/admin/orders/new";

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
          <input className="input-field pl-8" placeholder="Search orders…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Link href={newOrderHref} className="btn-primary"><Plus size={14} /> New Order</Link>
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
                      <Link href={`${editBase}/${order.id}/edit`} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--accent)" }} title="Edit"><Eye size={14} /></Link>
                      <a href={`${invoiceBase}/${order.id}/invoice`} target="_blank" className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Invoice"><Printer size={14} /></a>
                      <button onClick={() => setEmailOrder(order)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Email"><Mail size={14} /></button>
                      {!staffMode && <button onClick={() => setDeleteId(order.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }} title="Delete"><Trash2 size={14} /></button>}
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
