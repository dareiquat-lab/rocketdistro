"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageUpload } from "./ImageUpload";
import type { Product, Brand } from "@/types";

const schema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().min(0, "Quantity must be 0 or more"),
  price: z.number().min(0, "Price must be 0 or more"),
  cost: z.number().min(0, "Cost must be 0 or more"),
  barcode: z.string().optional(),
  notes: z.string().optional(),
  brand: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductFormWrapperProps {
  product?: Product;
}

export function ProductFormWrapper({ product }: ProductFormWrapperProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skuManual, setSkuManual] = useState(!!product);
  const [brands, setBrands] = useState<Brand[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_name: product?.product_name ?? "",
      sku: product?.sku ?? "",
      quantity: product?.quantity ?? 0,
      price: product ? Number(product.price) : 0,
      cost: product ? Number(product.cost) : 0,
      barcode: product?.barcode ?? "",
      notes: product?.notes ?? "",
      brand: product?.brand ?? "",
    },
  });

  useEffect(() => {
    fetch("/api/admin/brands").then(r => r.ok ? r.json() : []).then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    if (skuManual) return;
    const generateSku = async () => {
      const res = await fetch(`/api/products?admin=true&limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      const existingSkus: string[] = (data.products ?? []).map((p: Product) => p.sku);
      const matching = existingSkus.filter((s: string) => s.startsWith("PRD-"));
      let next = matching.length + 1;
      while (existingSkus.includes(`PRD-${String(next).padStart(3, "0")}`)) next++;
      setValue("sku", `PRD-${String(next).padStart(3, "0")}`);
    };
    generateSku();
  }, [skuManual, setValue]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError("");
    try {
      const body = {
        ...data,
        image_url: imageUrl,
        barcode: data.barcode || null,
        notes: data.notes || null,
        brand: data.brand || null,
      };
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
        <div>
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

        <div>
          <label className="label">Brand</label>
          <select className="input-field" {...register("brand")}>
            <option value="">— No brand —</option>
            {brands.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
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
