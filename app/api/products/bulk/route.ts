import { NextRequest, NextResponse } from "next/server";
import { bulkDeleteProducts } from "@/lib/db";
import { cookies } from "next/headers";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
    if (!token || token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
