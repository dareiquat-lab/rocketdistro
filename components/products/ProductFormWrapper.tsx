"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageUpload } from "./ImageUpload";
import type { Product, CategoryRecord } from "@/types";

const schema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().min(0, "Quantity must be 0 or more"),
  price: z.number().min(0, "Price must be 0 or more"),
  cost: z.number().min(0, "Cost must be 0 or more"),
  barcode: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORY_PREFIXES: Record<string, string> = {
  general: "GEN", beverages: "BVR", snacks: "SNK", tobacco: "TOB",
  electronics: "ELC", accessories: "ACC", health: "HLT",
  cleaning: "CLN", "paper goods": "PPR", candy: "CND",
};

interface ProductFormWrapperProps {
  product?: Product;
}

export function ProductFormWrapper({ product }: ProductFormWrapperProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skuManual, setSkuManual] = useState(!!product);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_name: product?.product_name ?? "",
      category: product?.category ?? "",
      sku: product?.sku ?? "",
      quantity: product?.quantity ?? 0,
      price: product ? Number(product.price) : 0,
      cost: product ? Number(product.cost) : 0,
      barcode: product?.barcode ?? "",
      notes: product?.notes ?? "",
    },
  });

  const selectedCategory = watch("category");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const cats = Array.isArray(data) ? data : [];
        setCategories(cats);
        if (!product && cats.length > 0 && !selectedCategory) {
          setValue("category", cats[0].name);
        }
      });
  }, []);

  useEffect(() => {
    if (skuManual || !selectedCategory) return;
    const generateSku = async () => {
      const res = await fetch(`/api/products?admin=true&category=${encodeURIComponent(selectedCategory)}&limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      const existingSkus: string[] = (data.products ?? []).map((p: Product) => p.sku);
      const key = selectedCategory.toLowerCase();
      const prefix = CATEGORY_PREFIXES[key] ?? selectedCategory.slice(0, 3).toUpperCase();
      const matching = existingSkus.filter((s: string) => s.startsWith(prefix + "-"));
      let next = matching.length + 1;
      while (existingSkus.includes(`${prefix}-${String(next).padStart(3, "0")}`)) next++;
      setValue("sku", `${prefix}-${String(next).padStart(3, "0")}`);
    };
    generateSku();
  }, [selectedCategory, skuManual, setValue]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError("");
    try {
      const body = { ...data, image_url: imageUrl, barcode: data.barcode || null, notes: data.notes || null };
      const res = product
        ? await fetch(`/api/products/${product.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        router.push("/admin/inventory");
        router.refresh();
      } else {
        const err = await res.json();
        setError(err.error ?? "Save failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-2xl space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold" style={{ color: "var(--text)" }}>Product Information</h2>
        <div>
          <label className="label">Product Name *</label>
          <input className="input-field" {...register("product_name")} />
          {errors.product_name && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.product_name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category *</label>
            <select className="input-field" {...register("category")}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
            {errors.category && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.category.message}</p>}
          </div>
          <div>
            <label className="label">SKU *</label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                {...register("sku")}
                onChange={e => { setValue("sku", e.target.value); setSkuManual(true); }}
              />
              <button
                type="button"
                className="btn-secondary py-1 px-2 text-xs"
                onClick={() => { setSkuManual(false); }}
                title="Auto-generate SKU"
              >
                Auto
              </button>
            </div>
            {errors.sku && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.sku.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Quantity *</label>
            <input className="input-field" type="number" min="0" {...register("quantity", { valueAsNumber: true })} />
            {errors.quantity && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="label">Price *</label>
            <input className="input-field" type="number" step="0.01" min="0" {...register("price", { valueAsNumber: true })} />
            {errors.price && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.price.message}</p>}
          </div>
          <div>
            <label className="label">Cost</label>
            <input className="input-field" type="number" step="0.01" min="0" {...register("cost", { valueAsNumber: true })} />
            {errors.cost && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.cost.message}</p>}
          </div>
        </div>
        <div>
          <label className="label">Barcode</label>
          <input className="input-field" {...register("barcode")} placeholder="Optional barcode" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input-field" rows={3} {...register("notes")} placeholder="Optional description or notes" />
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Product Image</h2>
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </div>

      {error && <p className="text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(220,38,38,0.1)", color: "var(--danger)" }}>{error}</p>}

      <div className="flex gap-3">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : product ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
