import { getAllProductsForExport } from "@/lib/db";
import { InventoryPrintClient } from "@/components/admin/InventoryPrintClient";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function InventoryPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
  if (!token || token !== expected) redirect("/admin/login");

  const { brand } = await searchParams;
  const products = await getAllProductsForExport(brand);

  return <InventoryPrintClient products={products} brand={brand} />;
}
