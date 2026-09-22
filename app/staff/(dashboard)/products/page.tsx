import { AdminHeader } from "@/components/layout/AdminHeader";
import { InventoryClient } from "@/components/admin/InventoryClient";

export const dynamic = "force-dynamic";

export default function StaffProductsPage() {
  return (
    <>
      <AdminHeader title="Products" breadcrumb="Staff / Products" />
      <InventoryClient staffMode />
    </>
  );
}
