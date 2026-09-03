"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Award } from "lucide-react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import type { Brand } from "@/types";

type BrandWithCount = Brand & { product_count: number };

export function BrandsAdminClient() {
  const [brands, setBrands] = useState<BrandWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandWithCount | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brands");
      if (res.ok) setBrands(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const openAdd = () => {
    setFormName("");
    setFormImageUrl("");
    setFormDescription("");
    setFormError("");
    setAddOpen(true);
  };

  const openEdit = (b: BrandWithCount) => {
    setEditBrand(b);
    setFormName(b.name);
    setFormImageUrl(b.image_url ?? "");
    setFormDescription(b.description ?? "");
    setFormError("");
  };

  const handleSaveNew = async () => {
    if (!formName.trim()) { setFormError("Brand name is required"); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          image_url: formImageUrl.trim() || null,
          description: formDescription.trim() || null,
        }),
      });
      if (!res.ok) { setFormError("Failed to save brand"); return; }
      setAddOpen(false);
      fetchBrands();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editBrand) return;
    if (!formName.trim()) { setFormError("Brand name is required"); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(`/api/admin/brands/${editBrand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          image_url: formImageUrl.trim() || null,
          description: formDescription.trim() || null,
        }),
      });
      if (!res.ok) { setFormError("Failed to update brand"); return; }
      setEditBrand(null);
      fetchBrands();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/brands/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchBrands();
    } finally {
      setDeleting(false);
    }
  };

  const BrandForm = ({ onSave }: { onSave: () => void }) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Brand Name</label>
        <input
          className="input-field w-full"
          value={formName}
          onChange={e => setFormName(e.target.value)}
          placeholder="e.g. Red Bull"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Image URL</label>
        <input
          className="input-field w-full"
          value={formImageUrl}
          onChange={e => setFormImageUrl(e.target.value)}
          placeholder="https://..."
        />
        {formImageUrl && (
          <div className="mt-2 relative w-16 h-16 rounded-lg overflow-hidden" style={{ background: "var(--muted)" }}>
            <Image src={formImageUrl} alt="preview" fill className="object-contain" sizes="64px" />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Description</label>
        <textarea
          className="input-field w-full resize-none"
          rows={3}
          value={formDescription}
          onChange={e => setFormDescription(e.target.value)}
          placeholder="Optional description…"
        />
      </div>
      {formError && <p className="text-sm" style={{ color: "var(--danger)" }}>{formError}</p>}
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={() => { setAddOpen(false); setEditBrand(null); }}>Cancel</button>
        <button className="btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save Brand"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Brands</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{brands.length} brand{brands.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl aspect-square animate-pulse" style={{ background: "var(--muted)" }} />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="card text-center py-16">
          <Award size={40} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>No brands yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>Brands are created automatically during invoice import or manually here.</p>
          <button className="btn-primary mt-4" onClick={openAdd}><Plus size={14} /> Add Brand</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map(b => (
            <div
              key={b.id}
              className="card flex flex-col items-center text-center gap-3 p-4"
            >
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--muted)" }}>
                {b.image_url ? (
                  <Image src={b.image_url} alt={b.name} fill className="object-contain p-1" sizes="80px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🏷️</div>
                )}
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{b.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{b.product_count} product{b.product_count !== 1 ? "s" : ""}</p>
                {b.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-dim)" }}>{b.description}</p>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <button
                  className="btn-secondary flex-1 py-1.5 text-xs"
                  onClick={() => openEdit(b)}
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  className="btn-danger py-1.5 px-2.5 text-xs"
                  onClick={() => setDeleteId(b.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Brand" size="md">
        <BrandForm onSave={handleSaveNew} />
      </Modal>

      <Modal open={editBrand !== null} onClose={() => setEditBrand(null)} title="Edit Brand" size="md">
        <BrandForm onSave={handleSaveEdit} />
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Brand" size="sm">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Delete this brand? Products associated with it will not be deleted, but their brand field will remain set.
        </p>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
