"use client";

import { useState, useEffect } from "react";
import { Printer, Mail, Clock, ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { EmailInvoiceModal } from "@/components/admin/EmailInvoiceModal";
import type { Order, InvoiceActivity, SupplierInvoice } from "@/types";
import { AdminHeader } from "@/components/layout/AdminHeader";

type Tab = "orders" | "supplier";

function CustomerInvoicesTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailOrder, setEmailOrder] = useState<Order | null>(null);
  const [activity, setActivity] = useState<Record<number, InvoiceActivity[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders?limit=100");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const loadActivity = async (orderId: number) => {
    if (activity[orderId]) { setExpandedId(expandedId === orderId ? null : orderId); return; }
    const res = await fetch(`/api/admin/orders/${orderId}/activity`);
    if (res.ok) {
      const data = await res.json();
      setActivity(prev => ({ ...prev, [orderId]: data }));
    }
    setExpandedId(orderId);
  };

  const itemTotal = (items: Order["items"]) =>
    (items ?? []).reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center" style={{ color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : orders.map(order => (
              <>
                <tr key={order.id}>
                  <td>
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--accent)" }}>{order.order_number}</span>
                  </td>
                  <td style={{ color: "var(--text)" }}>{order.customer_name}</td>
                  <td className="font-mono text-sm">${itemTotal(order.items).toFixed(2)}</td>
                  <td>
                    <span className="text-xs capitalize px-2 py-0.5 rounded-md font-medium" style={{ background: "var(--muted)", color: "var(--text-muted)" }}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>{format(new Date(order.created_at), "MMM d, yyyy")}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <a href={`/admin/orders/${order.id}/invoice`} target="_blank" className="p-1.5 rounded hover:opacity-70 inline-flex" style={{ color: "var(--text-muted)" }} title="Print Invoice">
                        <Printer size={14} />
                      </a>
                      <button onClick={() => setEmailOrder(order)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Email Invoice">
                        <Mail size={14} />
                      </button>
                      <button onClick={() => loadActivity(order.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Activity Log">
                        <Clock size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === order.id && (
                  <tr key={`${order.id}-activity`}>
                    <td colSpan={6} className="px-4 py-3" style={{ background: "var(--muted)" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Invoice Activity</p>
                      {(activity[order.id] ?? []).length === 0 ? (
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>No activity yet</p>
                      ) : (activity[order.id] ?? []).map(act => (
                        <div key={act.id} className="flex items-center gap-2 text-xs mb-1">
                          {act.action_type === "printed" ? <Printer size={12} /> : <Mail size={12} />}
                          <span style={{ color: "var(--text)" }}>{act.action_type === "printed" ? "Printed" : `Emailed to ${act.recipient_email}`}</span>
                          <span style={{ color: "var(--text-dim)" }}>{formatDistanceToNow(new Date(act.performed_at), { addSuffix: true })}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {emailOrder && (
        <EmailInvoiceModal order={emailOrder} onClose={() => { setEmailOrder(null); fetchOrders(); }} />
      )}
    </div>
  );
}

function SupplierInvoicesTab() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [itemsCache, setItemsCache] = useState<Record<number, SupplierInvoice["items"]>>({});

  useEffect(() => {
    fetch("/api/admin/supplier-invoices")
      .then(r => r.json())
      .then(d => setInvoices(d.invoices ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    if (!itemsCache[id]) {
      const res = await fetch(`/api/admin/supplier-invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItemsCache(prev => ({ ...prev, [id]: data.invoice.items ?? [] }));
      }
    }
    setExpandedId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href="/admin/import" className="btn-primary text-sm">
          <FileSpreadsheet size={14} /> Import Invoice
        </a>
      </div>
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th></th>
              <th>Supplier</th>
              <th>Invoice #</th>
              <th>Invoice Date</th>
              <th>Total</th>
              <th>Items</th>
              <th>Imported</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center" style={{ color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center" style={{ color: "var(--text-dim)" }}>No supplier invoices yet. Import an Excel file to get started.</td></tr>
            ) : invoices.map(inv => (
              <>
                <tr key={inv.id} className="cursor-pointer" onClick={() => toggleExpand(inv.id)}>
                  <td className="w-8">
                    {expandedId === inv.id ? <ChevronDown size={14} style={{ color: "var(--text-dim)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-dim)" }} />}
                  </td>
                  <td style={{ color: "var(--text)" }}>{inv.supplier_name}</td>
                  <td className="font-mono text-sm" style={{ color: "var(--accent)" }}>{inv.invoice_number || "—"}</td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>{inv.invoice_date || "—"}</td>
                  <td className="font-mono text-sm">${Number(inv.total_amount).toFixed(2)}</td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--text-muted)" }}>
                      {inv.import_source}
                    </span>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>{format(new Date(inv.created_at), "MMM d, yyyy")}</td>
                </tr>
                {expandedId === inv.id && (
                  <tr key={`${inv.id}-items`}>
                    <td colSpan={7} className="px-4 py-3" style={{ background: "var(--muted)" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Line Items</p>
                      {(itemsCache[inv.id] ?? []).length === 0 ? (
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>No items</p>
                      ) : (
                        <table className="table-base text-xs">
                          <thead><tr><th>Product</th><th>Category</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
                          <tbody>
                            {(itemsCache[inv.id] ?? []).map(item => (
                              <tr key={item.id}>
                                <td style={{ color: "var(--text)" }}>{item.product_name}</td>
                                <td style={{ color: "var(--text-muted)" }}>{item.category || "—"}</td>
                                <td className="font-mono">{item.quantity}</td>
                                <td className="font-mono">${Number(item.unit_cost).toFixed(2)}</td>
                                <td className="font-mono">${(Number(item.quantity) * Number(item.unit_cost)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoicesClient() {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        {([
          { value: "orders" as Tab, label: "Customer Invoices" },
          { value: "supplier" as Tab, label: "Supplier Invoices" },
        ]).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tab === t.value ? "var(--accent)" : "var(--surface)",
              color: tab === t.value ? "white" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" ? <CustomerInvoicesTab /> : <SupplierInvoicesTab />}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <>
      <AdminHeader title="Invoices" breadcrumb="Admin / Invoices" />
      <InvoicesClient />
    </>
  );
}
