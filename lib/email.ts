import type { Order } from "@/types";

const RESEND_API = "https://api.resend.com/emails";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY not configured" };

  const from = process.env.FROM_EMAIL ?? "orders@rocketdistro.com";
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }
  return { ok: true };
}

export function buildOrderNotificationEmail(order: Order): string {
  const items = order.items ?? [];
  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const adminUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders`
    : "/admin/orders";

  const rows = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${i.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace">$${(Number(i.price) * i.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;color:#0f172a">
      <div style="margin-bottom:24px">
        <h1 style="font-size:22px;font-weight:800;color:#2563eb;margin:0 0 4px">🚀 New Order Received</h1>
        <p style="margin:0;color:#475569;font-size:14px">Order <strong>${order.order_number}</strong></p>
      </div>

      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Customer</p>
        <p style="margin:0;font-weight:600">${order.customer_name}</p>
        <p style="margin:2px 0 0;color:#475569;font-size:14px">${order.customer_phone}</p>
        <p style="margin:2px 0 0;color:#475569;font-size:14px">${order.customer_email}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">Product</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px 12px;text-align:right;font-weight:700">Order Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;font-family:monospace">$${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${order.notes ? `<p style="background:#fefce8;border:1px solid #fde047;border-radius:6px;padding:12px;font-size:14px;margin-bottom:24px"><strong>Notes:</strong> ${order.notes}</p>` : ""}

      <a href="${adminUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;font-size:14px">
        View in Admin Portal →
      </a>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="color:#94a3b8;font-size:12px;margin:0">Rocket Distro — Wholesale Distribution</p>
    </body>
    </html>
  `;
}
