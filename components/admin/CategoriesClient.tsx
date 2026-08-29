"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { CategoryRecord } from "@/types";

interface CategoryWithCount extends CategoryRecord {
  product_count: number;
}

export function CategoriesClient() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [form, setForm] = useState({ name: "", description: "", icon: "📦" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories?withCount=true");
      if (res.ok) setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCats(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", icon: "📦" });
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryWithCount) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? "", icon: cat.icon });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { name: form.name, description: form.description || null, icon: form.icon };
      const res = editing
        ? await fetch(`/api/admin/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setModalOpen(false); fetchCats(); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reassignTo: reassignTo || undefined }),
      });
      setDeleteTarget(null);
      setReassignTo("");
      fetchCats();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={14} /> New Category
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-dim)" }}>Loading…</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={40} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
          <p style={{ color: "var(--text-muted)" }}>No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="card flex items-start gap-3">
              <span className="text-3xl">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "var(--text)" }}>{cat.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {cat.product_count} product{cat.product_count !== 1 ? "s" : ""}
                </p>
                {cat.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-dim)" }}>{cat.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--accent)" }}>
                  <Edit size={14} />
                </button>
                <button onClick={() => { setDeleteTarget(cat); setReassignTo(""); }} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Category" : "New Category"} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Icon (emoji)</label>
            <input className="input-field" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📦" />
          </div>
          <div>
            <label className="label">Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete Category" size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Delete <strong>{deleteTarget?.name}</strong>?
            {(deleteTarget?.product_count ?? 0) > 0 && (
              <> It has {deleteTarget?.product_count} product{deleteTarget?.product_count !== 1 ? "s" : ""}.</>
            )}
          </p>
          {(deleteTarget?.product_count ?? 0) > 0 && (
            <div>
              <label className="label">Reassign products to</label>
              <select className="input-field" value={reassignTo} onChange={e => setReassignTo(e.target.value)}>
                <option value="">— Delete without reassigning —</option>
                {categories.filter(c => c.id !== deleteTarget?.id).map(c => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
