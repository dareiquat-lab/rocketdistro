import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
    if (!(await isAdminOrStaff(adminToken, staffToken)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Extract numeric part from all PRD-NNN skus, find the max, add 1
    const rows = await sql`
      SELECT COALESCE(MAX(CAST(SUBSTRING(sku FROM 5) AS INTEGER)), 0) + 1 AS next
      FROM products
      WHERE sku ~ '^PRD-[0-9]+$'
    `;
    const next = rows[0]?.next ?? 1;
    const sku = `PRD-${String(next).padStart(3, "0")}`;
    return NextResponse.json({ sku });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
