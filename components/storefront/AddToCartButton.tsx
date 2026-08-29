"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "./CartContext";
import type { CartItem } from "@/types";

interface AddToCartButtonProps {
  product: Omit<CartItem, "quantity">;
  className?: string;
  showQty?: boolean;
}

export function AddToCartButton({ product, className, showQty = false }: AddToCartButtonProps) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return (
      <button disabled className={className ?? "btn-secondary w-full justify-center opacity-50 cursor-not-allowed"}>
        Out of Stock
      </button>
    );
  }

  const handleAdd = () => {
    add({ ...product, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={showQty ? "flex gap-2 items-center" : ""}>
      {showQty && (
        <div className="flex items-center gap-2">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg font-bold text-lg" style={{ background: "var(--muted)", color: "var(--text)" }}>−</button>
          <span className="w-8 text-center font-mono font-semibold" style={{ color: "var(--text)" }}>{qty}</span>
          <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-8 h-8 rounded-lg font-bold text-lg" style={{ background: "var(--muted)", color: "var(--text)" }}>+</button>
        </div>
      )}
      <button
        onClick={handleAdd}
        className={className ?? "btn-primary w-full justify-center"}
        style={added ? { background: "var(--success)" } : {}}
      >
        {added ? <Check size={16} /> : <ShoppingCart size={16} />}
        {added ? "Added!" : "Add to Cart"}
      </button>
    </div>
  );
}
