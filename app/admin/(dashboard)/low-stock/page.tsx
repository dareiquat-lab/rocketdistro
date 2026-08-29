import { AdminHeader } from "@/components/layout/AdminHeader";
import { LowStockClient } from "@/components/admin/LowStockClient";

export const dynamic = "force-dynamic";

export default function LowStockPage() {
  return (
    <>
      <AdminHeader title="Low Stock" breadcrumb="Admin / Low Stock" />
      <LowStockClient />
    </>
  );
}
