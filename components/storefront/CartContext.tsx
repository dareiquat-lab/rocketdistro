"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { CartItem } from "@/types";

interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (id: number) => void;
  update: (id: number, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue>({
  items: [], add: () => {}, remove: () => {}, update: () => {}, clear: () => {}, total: 0, count: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rd-cart");
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    try { localStorage.setItem("rd-cart", JSON.stringify(next)); } catch {}
  };

  const add = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map(i => i.id === item.id
          ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), i.stock) }
          : i
        );
      } else {
        next = [...prev, { ...item, quantity: item.quantity ?? 1 }];
      }
      try { localStorage.setItem("rd-cart", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const remove = (id: number) => persist(items.filter(i => i.id !== id));

  const update = (id: number, quantity: number) => {
    if (quantity <= 0) { remove(id); return; }
    persist(items.map(i => i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i));
  };

  const clear = () => persist([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, update, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
