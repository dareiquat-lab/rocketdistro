import Image from "next/image";
import Link from "next/link";
import { getStorefrontProducts, getCategoryWithProductCount, getBrandWithProductCount } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ArrowRight, Bookmark, Rocket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [productsData, categories, brands] = await Promise.all([
    getStorefrontProducts({ limit: 8 }).catch(() => ({ products: [], total: 0, pages: 1 })),
    getCategoryWithProductCount().catch(() => []),
    getBrandWithProductCount().catch(() => []),
  ]);

  const products = productsData.products;
  const totalProducts = productsData.total;
  const totalCategories = categories.length;
  const activeBrands = brands.filter((b) => b.product_count > 0);

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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
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
                { value: activeBrands.length.toString(), label: "Brands" },
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
              <Link href="/brands" className="btn-secondary text-base px-6 py-3">
                <Bookmark size={16} /> Shop by Brand
              </Link>
            </div>
          </div>

          {/* Decorative rocket */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="hero-rocket">
              <Rocket size={220} strokeWidth={0.75} />
            </div>
          </div>

          </div>
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

      {/* Shop by Brand — featured box */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
                <Bookmark size={18} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-black" style={{ color: "var(--text)" }}>Shop by Brand</h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{activeBrands.length} brand{activeBrands.length !== 1 ? "s" : ""} available</p>
              </div>
            </div>
            <Link
              href="/brands"
              className="btn-primary"
            >
              All Brands <ArrowRight size={14} />
            </Link>
          </div>

          {/* Brand grid */}
          {activeBrands.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-3xl mb-3">🏷️</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Brands will appear here once products are imported.</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {activeBrands.slice(0, 16).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?category=${encodeURIComponent(brand.name)}`}
                  className="group flex flex-col items-center text-center gap-2 p-3 rounded-xl transition-all hover:shadow-sm"
                  style={{ textDecoration: "none", background: "var(--muted)" }}
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden" style={{ background: "var(--surface)" }}>
                    {brand.image_url ? (
                      <Image src={brand.image_url} alt={brand.name} fill className="object-contain p-1" sizes="56px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">🏷️</div>
                    )}
                  </div>
                  <p className="font-semibold text-xs leading-tight" style={{ color: "var(--text)" }}>{brand.name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Shop by Category */}
      {categories.filter(c => c.product_count > 0).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Shop by Category</h2>
            <Link href="/categories" className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--accent)", textDecoration: "none" }}>
              All Categories <ArrowRight size={14} />
            </Link>
          </div>
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
