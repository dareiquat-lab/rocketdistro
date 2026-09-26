import { AdminHeader } from "@/components/layout/AdminHeader";
import { CreateOrderClient } from "@/components/admin/CreateOrderClient";

export const dynamic = "force-dynamic";

export default function StaffNewOrderPage() {
  return (
    <>
      <AdminHeader title="New Order" breadcrumb="Staff / Orders / New" />
      <CreateOrderClient staffMode />
    </>
  );
}
