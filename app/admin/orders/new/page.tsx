import { AdminHeader } from "@/components/layout/AdminHeader";
import { CreateOrderClient } from "@/components/admin/CreateOrderClient";

export const dynamic = "force-dynamic";

export default function NewOrderPage() {
  return (
    <>
      <AdminHeader title="New Order" breadcrumb="Admin / Orders / New" />
      <CreateOrderClient />
    </>
  );
}
