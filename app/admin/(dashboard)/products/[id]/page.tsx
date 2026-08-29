import { AdminHeader } from "@/components/layout/AdminHeader";
import { ProductFormWrapper } from "@/components/products/ProductFormWrapper";
import { getProductById } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(parseInt(id)).catch(() => null);
  if (!product) notFound();

  return (
    <>
      <AdminHeader title="Edit Product" breadcrumb={`Admin / Inventory / ${product.product_name}`} />
      <ProductFormWrapper product={product} />
    </>
  );
}
