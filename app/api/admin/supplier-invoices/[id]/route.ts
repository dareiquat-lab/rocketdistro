import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";
import { getSupplierInvoiceById, deleteSupplierInvoice } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  if (!(await isAdminOrStaff(adminToken, staffToken)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await getSupplierInvoiceById(parseInt(id));
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  if (!(await isAdminOrStaff(adminToken, staffToken)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteSupplierInvoice(parseInt(id));
  return NextResponse.json({ ok: true });
}
