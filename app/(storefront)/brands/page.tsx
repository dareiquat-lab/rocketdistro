import Image from "next/image";
import Link from "next/link";
import { getBrandWithProductCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await getBrandWithProductCount();
  const active = brands.filter((b) => b.product_count > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Brands</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>{active.length} brand{active.length !== 1 ? "s" : ""} available</p>

      {active.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏷️</p>
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>No brands yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {active.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="flex flex-col items-center text-center gap-3 p-4 rounded-xl transition-shadow hover:shadow-md"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", textDecoration: "none" }}
            >
              <div className="relative w-20 h-20 rounded-xl overflow-hidden" style={{ background: "var(--muted)" }}>
                {brand.image_url ? (
                  <Image src={brand.image_url} alt={brand.name} fill className="object-contain p-1" sizes="80px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🏷️</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{brand.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{brand.product_count} product{brand.product_count !== 1 ? "s" : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
