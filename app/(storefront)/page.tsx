import Link from "next/link";
import { getStorefrontProducts } from "@/lib/db";
import { getCategoryWithProductCount } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ArrowRight, Tag, ShoppingCart, CheckCircle, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [productsData, categories] = await Promise.all([
    getStorefrontProducts({ limit: 8 }).catch(() => ({ products: [], total: 0, pages: 1 })),
    getCategoryWithProductCount().catch(() => []),
  ]);

  const products = productsData.products;
  const totalProducts = productsData.total;
  const totalCategories = categories.length;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        {/* Grid background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(22,163,74,0.1)", color: "var(--success)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--success)" }} />
              Official Wholesale Distributor
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6" style={{ color: "var(--text)" }}>
              <span style={{ color: "var(--accent)" }}>ROCKET</span>{" "}
              DISTRO WHOLESALE
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-xl" style={{ color: "var(--text-muted)" }}>
              Browse our full catalog of wholesale products. Submit your order request and we'll confirm availability and pricing.
            </p>
            {/* Stats */}
            <div className="flex gap-8 mb-10">
              {[
                { value: totalProducts.toLocaleString(), label: "Products" },
                { value: totalCategories.toString(), label: "Categories" },
                { value: "0%", label: "Tax Online" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{s.value}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary text-base px-6 py-3">
                Browse Products <ArrowRight size={16} />
              </Link>
              <Link href="/categories" className="btn-secondary text-base px-6 py-3">
                <Tag size={16} /> Shop by Category
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-center text-2xl font-bold mb-10" style={{ color: "var(--text)" }}>How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <ShoppingCart size={28} />, step: "1", title: "Browse", desc: "Browse our full product catalog and add items to your cart." },
            { icon: <CheckCircle size={28} />, step: "2", title: "Submit Request", desc: "Fill in your contact info and submit your order request online." },
            { icon: <Star size={28} />, step: "3", title: "We Contact You", desc: "Our team will reach out to confirm your order and arrange fulfillment." },
          ].map(item => (
            <div key={item.step} className="card text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--accent)", color: "white" }}>
                {item.icon}
              </div>
              <div className="text-xs font-bold mb-1" style={{ color: "var(--text-dim)" }}>STEP {item.step}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>{item.title}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Featured Products</h2>
            <Link href="/products" className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--accent)", textDecoration: "none" }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <ProductCard key={p.id} product={p as Parameters<typeof ProductCard>[0]["product"]} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.filter(c => c.product_count > 0).map(cat => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="card flex flex-col items-center text-center py-6 hover:shadow-md transition-shadow"
                style={{ textDecoration: "none" }}
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{cat.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{cat.product_count} products</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--accent)" }}>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to Order?</h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">Browse our catalog, add products to your cart, and submit your wholesale order request today.</p>
          <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90" style={{ background: "white", color: "var(--accent)" }}>
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
