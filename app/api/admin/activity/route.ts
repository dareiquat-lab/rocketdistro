import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  if (!(await isAdminOrStaff(adminToken, staffToken)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(10, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  try {
    const [rows, countRows] = await Promise.all([
      sql`
        SELECT event_type, id, ref, label, meta, ts, created_at FROM (
          SELECT 'order'::text  AS event_type, id, order_number       AS ref, customer_name  AS label, status           AS meta, created_at AS ts, created_at FROM orders
          UNION ALL
          SELECT 'product'::text,              id, sku                AS ref, product_name   AS label, quantity::text   AS meta, updated_at AS ts, created_at FROM products
          UNION ALL
          SELECT 'invoice'::text,              id, COALESCE(invoice_number,'') AS ref, supplier_name AS label, total_amount::text AS meta, created_at AS ts, created_at FROM supplier_invoices
        ) activity
        ORDER BY ts DESC
        LIMIT ${limit} OFFSET ${offset}
      `.catch(() => []),
      sql`
        SELECT (
          (SELECT COUNT(*) FROM orders) +
          (SELECT COUNT(*) FROM products) +
          (SELECT COUNT(*) FROM supplier_invoices)
        )::int AS total
      `.catch(() => [{ total: 0 }]),
    ]);

    const total = parseInt(String(countRows[0]?.total ?? "0"), 10);
    return NextResponse.json({
      items: rows,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
