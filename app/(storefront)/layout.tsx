import { CartProvider } from "@/components/storefront/CartContext";
import { StorefrontNav } from "@/components/storefront/StorefrontNav";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <StorefrontNav />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t mt-16" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🚀</span>
                  <span className="font-black" style={{ color: "var(--text)" }}>ROCKET DISTRO</span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Your trusted wholesale distribution partner. Quality products at competitive prices.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>Quick Links</p>
                <div className="space-y-2">
                  {[["Home", "/"], ["Products", "/products"], ["Categories", "/categories"]].map(([label, href]) => (
                    <a key={href} href={href} className="block text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)", textDecoration: "none" }}>{label}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>For Business</p>
                <div className="space-y-2">
                  <a href="/admin" className="block text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Staff Portal</a>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Wholesale only</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-6 text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                © {new Date().getFullYear()} Rocket Distro. All rights reserved. Wholesale Distribution.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
