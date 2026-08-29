import { AdminHeader } from "@/components/layout/AdminHeader";
import { InventoryClient } from "@/components/admin/InventoryClient";

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <>
      <AdminHeader title="Inventory" breadcrumb="Admin / Inventory" />
      <InventoryClient />
    </>
  );
}
