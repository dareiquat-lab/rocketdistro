import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, STAFF_COOKIE, isAdminOrStaff } from "@/lib/auth-utils";
import { getBrandWithProductCount, upsertBrand, applyBrandImageToProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
    if (!(await isAdminOrStaff(adminToken, staffToken)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brands = await getBrandWithProductCount();
    return NextResponse.json(brands);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
    const staffToken = cookieStore.get(STAFF_COOKIE)?.value;
    if (!(await isAdminOrStaff(adminToken, staffToken)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, image_url } = body;
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const brand = await upsertBrand(name, image_url ?? null);
    if (brand.image_url && image_url) {
      await applyBrandImageToProducts(brand.name, brand.image_url);
    }
    return NextResponse.json(brand, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
