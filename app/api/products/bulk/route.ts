import { NextRequest, NextResponse } from "next/server";
import { bulkDeleteProducts, bulkAssignBrand } from "@/lib/db";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
  return isAdminOrStaff(adminToken, staffToken);
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const ids: number[] = body.ids ?? [];
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "No ids" }, { status: 400 });
    await bulkDeleteProducts(ids);
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const ids: number[] = body.ids ?? [];
    const brand: string | null = body.brand ?? null;
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "No ids" }, { status: 400 });
    await bulkAssignBrand(ids, brand);
    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
