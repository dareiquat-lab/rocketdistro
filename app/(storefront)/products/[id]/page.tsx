import { getProductById } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import type { CartItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(parseInt(id)).catch(() => null);
  if (!product) notFound();

  const cartItem: Omit<CartItem, "quantity"> = {
    id: product.id,
    product_name: product.product_name,
    sku: product.sku,
    price: Number(product.price),
    image_url: product.image_url,
    category: product.category,
    stock: product.quantity,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-70" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden aspect-square relative" style={{ background: "var(--muted)" }}>
          {product.image_url ? (
            <Image src={product.image_url} alt={product.product_name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">📦</div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="text-xs px-2 py-1 rounded-md font-medium mb-3 inline-block" style={{ background: "var(--muted)", color: "var(--text-muted)" }}>
            {product.category}
          </span>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>{product.product_name}</h1>
          <p className="font-mono text-sm mb-4" style={{ color: "var(--text-dim)" }}>{product.sku}</p>
          <p className="text-3xl font-black mb-4" style={{ color: "var(--accent)" }}>${Number(product.price).toFixed(2)}</p>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm" style={{ color: product.quantity > 0 ? "var(--success)" : "var(--danger)" }}>
              {product.quantity > 0 ? `✓ In Stock (${product.quantity} units)` : "✗ Out of Stock"}
            </span>
          </div>

          {product.notes && (
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>{product.notes}</p>
          )}

          <AddToCartButton product={cartItem} showQty={product.quantity > 0} className="btn-primary px-6 py-3 text-base" />

          <p className="text-xs mt-4" style={{ color: "var(--text-dim)" }}>
            Wholesale pricing. Submit a cart request and we'll confirm details.
          </p>
        </div>
      </div>
    </div>
  );
}
