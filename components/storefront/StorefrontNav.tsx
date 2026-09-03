"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X, Sun, Moon, Rocket } from "lucide-react";
import { useCart } from "./CartContext";
import { CartSheet } from "./CartSheet";
import { useTheme } from "@/components/ThemeProvider";

export function StorefrontNav() {
  const { count } = useCart();
  const { theme, toggle } = useTheme();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/categories", label: "Categories" },
    { href: "/brands", label: "Brands" },
    { href: "/staff", label: "Staff" },
  ];

  return (
    <>
      <nav
        className="sticky top-0 z-30 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center nav-active" style={{ background: "var(--accent)" }}>
              <Rocket size={16} color="var(--accent-fg)" />
            </div>
            <span className="font-black text-sm tracking-wide" style={{ color: "var(--text)" }}>ROCKET DISTRO</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="p-2 rounded-lg relative"
              style={{ color: "var(--text-muted)" }}
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ background: "var(--accent)", fontSize: "10px" }}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium"
                style={{ color: "var(--text-muted)", textDecoration: "none" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
