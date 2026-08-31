import { NextRequest, NextResponse } from "next/server";
import { createOrder, logEmail } from "@/lib/db";
import { sendEmail, buildOrderNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.customer_name || !body.customer_phone || !body.customer_email) {
      return NextResponse.json({ error: "Name, phone, and email are required" }, { status: 400 });
    }
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }

    const order = await createOrder(body);

    // Fire admin notification — non-blocking, don't fail the order if email fails
    const adminEmail = process.env.ADMIN_EMAIL ?? "rocketdistro818@gmail.com";
    const subject = `New Order ${order.order_number} — ${order.customer_name}`;
    const html = buildOrderNotificationEmail(order);
    const result = await sendEmail({ to: adminEmail, subject, html });

    await logEmail({
      order_id: order.id,
      order_number: order.order_number,
      type: "order_notification",
      to_email: adminEmail,
      subject,
      status: result.ok ? "sent" : "failed",
      error: result.error ?? null,
    }).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
