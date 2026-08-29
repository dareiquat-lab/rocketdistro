import { NextRequest, NextResponse } from "next/server";
import { getOrderById, logInvoiceActivity } from "@/lib/db";
import { cookies } from "next/headers";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/auth-utils";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
    if (!token || token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const to: string = body.to;
    if (!to) return NextResponse.json({ error: "Recipient email required" }, { status: 400 });

    const order = await getOrderById(parseInt(id));
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const items = order.items ?? [];
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const dateStr = format(new Date(order.created_at), "MMMM d, yyyy");

    const itemRows = items.map(i => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${i.product_name}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace">${i.product_sku ?? "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">$${Number(i.price).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">$${(Number(i.price) * i.quantity).toFixed(2)}</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Invoice ${order.order_number}</title></head>
      <body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;color:#0f172a">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="font-size:28px;font-weight:800;color:#2563eb;margin:0">🚀 ROCKET DISTRO</h1>
          <p style="color:#475569;margin:4px 0">Wholesale Distribution</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:24px">
          <div>
            <p style="font-size:12px;color:#475569;margin:0">INVOICE #</p>
            <p style="font-weight:700;margin:2px 0">${order.order_number}</p>
            <p style="font-size:12px;color:#475569;margin:4px 0">DATE</p>
            <p style="margin:2px 0">${dateStr}</p>
          </div>
          <div style="text-align:right">
            <p style="font-size:12px;color:#475569;margin:0">BILL TO</p>
            <p style="font-weight:600;margin:2px 0">${order.customer_name}</p>
            <p style="margin:2px 0">${order.customer_phone}</p>
            <p style="margin:2px 0">${order.customer_email}</p>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:12px;text-transform:uppercase">Product</th>
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:12px;text-transform:uppercase">SKU</th>
              <th style="padding:8px;text-align:center;border-bottom:2px solid #e2e8f0;font-size:12px;text-transform:uppercase">Qty</th>
              <th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0;font-size:12px;text-transform:uppercase">Unit Price</th>
              <th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0;font-size:12px;text-transform:uppercase">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="padding:8px;text-align:right;font-weight:700">Total</td>
              <td style="padding:8px;text-align:right;font-weight:700">$${subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        ${order.notes ? `<p style="background:#f8fafc;padding:12px;border-radius:8px;font-size:14px"><strong>Notes:</strong> ${order.notes}</p>` : ""}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="text-align:center;color:#475569;font-size:14px">Thank you for your business! Questions? Contact us at ${process.env.FROM_EMAIL ?? "orders@rocketdistro.com"}</p>
      </body>
      </html>
    `;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL ?? "orders@rocketdistro.com",
          to,
          subject: `Invoice ${order.order_number} — Rocket Distro`,
          html,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Resend error:", err);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }
    }

    await logInvoiceActivity({ order_id: parseInt(id), action_type: "emailed", recipient_email: to });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
