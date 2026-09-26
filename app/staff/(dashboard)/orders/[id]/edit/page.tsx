import { getOrderById } from "@/lib/db";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { EditOrderClient } from "@/components/admin/EditOrderClient";

export const dynamic = "force-dynamic";

export default async function StaffEditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(parseInt(id)).catch(() => null);
  if (!order) notFound();

  return (
    <>
      <AdminHeader title={`Edit ${order.order_number}`} breadcrumb="Staff / Orders / Edit" />
      <EditOrderClient order={order} staffMode />
    </>
  );
}
