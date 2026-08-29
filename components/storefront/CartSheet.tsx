"use client";

import { useEffect } from "react";
import { X, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CartSheet({ open, onClose }: CartSheetProps) {
  const { items, remove, update, total, clear } = useCart();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm flex flex-col transition-transform duration-300"
        style={{
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} style={{ color: "var(--text)" }} />
            <span className="font-semibold" style={{ color: "var(--text)" }}>Your Cart</span>
            {items.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: "var(--accent)" }}>
                {items.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clear} className="text-xs" style={{ color: "var(--text-dim)" }}>Clear all</button>
            )}
            <button onClick={onClose} className="p-1" style={{ color: "var(--text-muted)" }}><X size={20} /></button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
              <p className="font-medium" style={{ color: "var(--text-muted)" }}>Your cart is empty</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Browse products to add items</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="flex gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--muted)" }}>
                {item.image_url ? (
                  <div className="relative w-full h-full">
                    <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="56px" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{item.product_name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>${item.price.toFixed(2)} each</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button onClick={() => update(item.id, item.quantity - 1)} className="w-6 h-6 rounded text-sm font-bold" style={{ background: "var(--muted)", color: "var(--text)" }}>−</button>
                  <span className="text-sm font-mono w-6 text-center" style={{ color: "var(--text)" }}>{item.quantity}</span>
                  <button onClick={() => update(item.id, item.quantity + 1)} className="w-6 h-6 rounded text-sm font-bold" style={{ background: "var(--muted)", color: "var(--text)" }}>+</button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => remove(item.id)} className="p-1" style={{ color: "var(--text-dim)" }}><Trash2 size={14} /></button>
                <p className="text-sm font-semibold font-mono" style={{ color: "var(--text)" }}>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between items-center">
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>Subtotal</span>
              <span className="text-xl font-bold font-mono" style={{ color: "var(--text)" }}>${total.toFixed(2)}</span>
            </div>
            <Link
              href="/products#order-form"
              onClick={onClose}
              className="btn-primary w-full justify-center"
            >
              Proceed to Order
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
