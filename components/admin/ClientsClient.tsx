"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit, Trash2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Client, Order } from "@/types";
import { CLIENT_TYPES } from "@/types";

const TYPE_BADGE_MAP: Record<string, "info" | "success" | "warning" | "purple" | "default"> = {
  Retailer: "info", "Store Owner": "success", Distributor: "warning", Supplier: "purple", "Chain Store": "info", Other: "default",
};

const emptyClient = (): Partial<Client> => ({
  business_name: "", contact_name: "", phone: "", email: "", address: "", city: "", state: "", zip: "",
  tobacco_license_number: "", sellers_permit_number: "", client_type: "Retailer", notes: "",
});

export function ClientsClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [clientType, setClientType] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<Client>>(emptyClient());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: debouncedSearch, clientType, page: String(page), limit: "25" });
      const res = await fetch(`/api/admin/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, clientType, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openDetail = async (client: Client) => {
    setDetailClient(client);
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/orders`);
      if (res.ok) setClientOrders(await res.json());
    } finally {
      setLoadingOrders(false);
    }
  };

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyClient());
    setFormOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({ ...client });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.business_name) return;
    setSaving(true);
    try {
      const res = editingClient
        ? await fetch(`/api/admin/clients/${editingClient.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setFormOpen(false); fetchClients(); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/clients/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchClients();
    } finally {
      setDeleting(false);
    }
  };

  const f = (field: keyof Client) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
          <input className="input-field pl-8" placeholder="Search clients…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-full sm:w-44" value={clientType} onChange={e => { setClientType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn-primary" onClick={openCreate}><Plus size={14} /> New Client</button>
      </div>

      <p className="text-xs" style={{ color: "var(--text-dim)" }}>{total.toLocaleString()} client{total !== 1 ? "s" : ""}</p>

      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Business</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Type</th>
              <th>Location</th>
              <th>License #</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center" style={{ color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Users size={40} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
                  <p style={{ color: "var(--text-muted)" }}>No clients found</p>
                </td>
              </tr>
            ) : clients.map(client => (
              <tr key={client.id}>
                <td>
                  <button onClick={() => openDetail(client)} className="font-medium hover:underline text-left" style={{ color: "var(--accent)" }}>
                    {client.business_name}
                  </button>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{client.contact_name ?? "—"}</td>
                <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{client.phone ?? "—"}</td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{client.email ?? "—"}</td>
                <td><Badge variant={TYPE_BADGE_MAP[client.client_type] ?? "default"}>{client.client_type}</Badge></td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {[client.city, client.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{client.tobacco_license_number ?? "—"}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(client)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--accent)" }}><Edit size={14} /></button>
                    <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded text-sm font-medium" style={{ background: p === page ? "var(--accent)" : "var(--surface)", color: p === page ? "white" : "var(--text)", border: "1px solid var(--border)" }}>{p}</button>
          ))}
          <button className="btn-secondary py-1.5 px-3" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
        </div>
      )}

      {/* Client Detail Modal */}
      <Modal open={detailClient !== null} onClose={() => setDetailClient(null)} title={detailClient?.business_name ?? ""} size="xl">
        {detailClient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Contact", detailClient.contact_name], ["Phone", detailClient.phone], ["Email", detailClient.email],
                ["Type", detailClient.client_type], ["Address", detailClient.address],
                ["City/State/Zip", [detailClient.city, detailClient.state, detailClient.zip].filter(Boolean).join(", ")],
                ["Tobacco License", detailClient.tobacco_license_number], ["Seller's Permit", detailClient.sellers_permit_number],
              ].map(([label, value]) => value ? (
                <div key={label as string}>
                  <p className="label mb-0">{label}</p>
                  <p style={{ color: "var(--text)" }}>{value}</p>
                </div>
              ) : null)}
            </div>
            {detailClient.notes && (
              <div>
                <p className="label">Notes</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{detailClient.notes}</p>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>Order History</h3>
              {loadingOrders ? (
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>Loading…</p>
              ) : clientOrders.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {clientOrders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                      <div>
                        <p className="font-mono text-sm font-semibold" style={{ color: "var(--accent)" }}>{o.order_number}</p>
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>{format(new Date(o.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <Badge variant={STATUS_BADGE_MAP[o.status] ?? "default"}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button className="btn-secondary" onClick={() => { setDetailClient(null); openEdit(detailClient); }}>Edit Client</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingClient ? "Edit Client" : "New Client"} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Business Name *</label><input className="input-field" value={form.business_name ?? ""} onChange={f("business_name")} /></div>
          <div><label className="label">Contact Name</label><input className="input-field" value={form.contact_name ?? ""} onChange={f("contact_name")} /></div>
          <div><label className="label">Client Type</label>
            <select className="input-field" value={form.client_type ?? "Retailer"} onChange={f("client_type")}>
              {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Phone</label><input className="input-field" value={form.phone ?? ""} onChange={f("phone")} /></div>
          <div><label className="label">Email</label><input className="input-field" value={form.email ?? ""} onChange={f("email")} /></div>
          <div><label className="label">Tobacco License #</label><input className="input-field" value={form.tobacco_license_number ?? ""} onChange={f("tobacco_license_number")} /></div>
          <div><label className="label">Seller's Permit #</label><input className="input-field" value={form.sellers_permit_number ?? ""} onChange={f("sellers_permit_number")} /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input className="input-field" value={form.address ?? ""} onChange={f("address")} /></div>
          <div><label className="label">City</label><input className="input-field" value={form.city ?? ""} onChange={f("city")} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">State</label><input className="input-field" value={form.state ?? ""} onChange={f("state")} maxLength={2} /></div>
            <div><label className="label">ZIP</label><input className="input-field" value={form.zip ?? ""} onChange={f("zip")} /></div>
          </div>
          <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input-field" rows={2} value={form.notes ?? ""} onChange={f("notes")} /></div>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.business_name}>{saving ? "Saving…" : editingClient ? "Save Changes" : "Create Client"}</button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Client" size="sm">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Delete this client? Their orders will remain but be unlinked.</p>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
        </div>
      </Modal>
    </div>
  );
}

const STATUS_BADGE_MAP: Record<string, "info" | "purple" | "warning" | "success" | "danger" | "default"> = {
  new: "info", contacted: "purple", ready: "warning", completed: "success", cancelled: "danger",
};
