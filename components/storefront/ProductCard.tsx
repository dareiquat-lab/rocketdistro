"use client";

import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "./AddToCartButton";
import type { CartItem } from "@/types";

interface ProductCardProps {
  product: {
    id: number;
    product_name: string;
    category: string;
    sku: string;
    price: number;
    quantity: number;
    image_url: string | null;
    notes?: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
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
    <div
      className="rounded-xl overflow-hidden flex flex-col transition-shadow hover:shadow-md"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <Link href={`/products/${product.id}`} className="block" style={{ textDecoration: "none" }}>
        <div className="relative aspect-square" style={{ background: "var(--muted)" }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.product_name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">📦</div>
          )}
          {product.quantity === 0 && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ background: "var(--danger)" }}>Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: "var(--muted)", color: "var(--text-muted)" }}>
              {product.category}
            </span>
          </div>
          <h3 className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: "var(--text)" }}>
            {product.product_name}
          </h3>
          <p className="text-xs font-mono mb-2" style={{ color: "var(--text-dim)" }}>{product.sku}</p>
          <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>${Number(product.price).toFixed(2)}</p>
        </div>
      </Link>
      <div className="px-3 pb-3 mt-auto">
        <AddToCartButton product={cartItem} />
      </div>
    </div>
  );
}
