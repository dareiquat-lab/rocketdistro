import { AdminHeader } from "@/components/layout/AdminHeader";
import { ProductFormWrapper } from "@/components/products/ProductFormWrapper";

export const dynamic = "force-dynamic";

export default function StaffNewProductPage() {
  return (
    <>
      <AdminHeader title="New Product" breadcrumb="Staff / Products / New" />
      <ProductFormWrapper backPath="/staff/products" />
    </>
  );
}
