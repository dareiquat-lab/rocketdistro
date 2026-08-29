import { AdminHeader } from "@/components/layout/AdminHeader";
import { OrdersClient } from "@/components/admin/OrdersClient";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <>
      <AdminHeader title="Orders" breadcrumb="Admin / Orders" />
      <OrdersClient />
    </>
  );
}
