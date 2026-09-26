import { getOrderById } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";
import { InvoicePrintClient } from "@/components/admin/InvoicePrintClient";
import { logInvoiceActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StaffInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  if (!(await isAdminOrStaff(adminToken, staffToken))) {
    redirect("/staff/login");
  }

  const { id } = await params;
  const order = await getOrderById(parseInt(id)).catch(() => null);
  if (!order) notFound();

  await logInvoiceActivity({ order_id: order.id, action_type: "printed" }).catch(() => {});

  return <InvoicePrintClient order={order} />;
}
