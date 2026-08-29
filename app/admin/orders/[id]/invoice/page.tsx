import { getOrderById } from "@/lib/db";
import { notFound } from "next/navigation";
import { InvoicePrintClient } from "@/components/admin/InvoicePrintClient";
import { logInvoiceActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(parseInt(id)).catch(() => null);
  if (!order) notFound();

  await logInvoiceActivity({ order_id: order.id, action_type: "printed" }).catch(() => {});

  return <InvoicePrintClient order={order} />;
}
