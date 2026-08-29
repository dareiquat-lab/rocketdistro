import { getCategoryWithProductCount } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoryWithProductCount().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text)" }}>Categories</h1>
      {categories.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No categories yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="card flex flex-col items-center text-center py-8 hover:shadow-md transition-shadow"
              style={{ textDecoration: "none" }}
            >
              <span className="text-4xl mb-3">{cat.icon}</span>
              <p className="font-bold" style={{ color: "var(--text)" }}>{cat.name}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{cat.product_count} product{cat.product_count !== 1 ? "s" : ""}</p>
              {cat.description && (
                <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-dim)" }}>{cat.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
