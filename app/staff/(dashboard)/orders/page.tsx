import { AdminHeader } from "@/components/layout/AdminHeader";
import { OrdersClient } from "@/components/admin/OrdersClient";

export const dynamic = "force-dynamic";

export default function StaffOrdersPage() {
  return (
    <>
      <AdminHeader title="Orders" breadcrumb="Staff / Orders" />
      <OrdersClient staffMode />
    </>
  );
}
