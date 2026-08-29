import { AdminHeader } from "@/components/layout/AdminHeader";
import { CategoriesClient } from "@/components/admin/CategoriesClient";

export const dynamic = "force-dynamic";

export default function CategoriesPage() {
  return (
    <>
      <AdminHeader title="Categories" breadcrumb="Admin / Categories" />
      <CategoriesClient />
    </>
  );
}
