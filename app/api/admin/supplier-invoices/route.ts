import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";
import { createSupplierInvoice, getSupplierInvoices } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  if (!(await isAdminOrStaff(adminToken, staffToken)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = parseInt(new URL(req.url).searchParams.get("limit") ?? "100");
  const invoices = await getSupplierInvoices(limit);
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  if (!(await isAdminOrStaff(adminToken, staffToken)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const invoice = await createSupplierInvoice(body);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
