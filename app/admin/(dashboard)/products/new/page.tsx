import { AdminHeader } from "@/components/layout/AdminHeader";
import { ProductFormWrapper } from "@/components/products/ProductFormWrapper";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <>
      <AdminHeader title="New Product" breadcrumb="Admin / Inventory / New" />
      <ProductFormWrapper />
    </>
  );
}
