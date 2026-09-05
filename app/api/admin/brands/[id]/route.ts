import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";
import { getBrands, updateBrand, deleteBrand, applyBrandImageToProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
    if (!(await isAdminOrStaff(adminToken, staffToken)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const brands = await getBrands();
    const brand = brands.find((b) => b.id === parseInt(id));
    if (!brand) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(brand);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
    if (!(await isAdminOrStaff(adminToken, staffToken)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const brand = await updateBrand(parseInt(id), body);
    if (!brand) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (brand.image_url && body.image_url) {
      await applyBrandImageToProducts(brand.name, brand.image_url);
    }
    return NextResponse.json(brand);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
    if (!(await isAdminOrStaff(adminToken, staffToken)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await deleteBrand(parseInt(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
