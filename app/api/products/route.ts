import { NextRequest, NextResponse } from "next/server";
import { getStorefrontProducts, createProduct, getProducts } from "@/lib/db";
import { cookies } from "next/headers";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "24");
    const admin = searchParams.get("admin") === "true";

    if (admin) {
      const cookieStore = await cookies();
      const token = cookieStore.get(ADMIN_COOKIE)?.value;
      const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
      if (!token || token !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const sortBy = searchParams.get("sortBy") ?? "created_at";
      const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";
      const lowStock = searchParams.get("lowStock") === "true";
      const result = await getProducts({ search, category, sortBy, sortDir, page, limit, lowStock });
      return NextResponse.json(result);
    }

    const result = await getStorefrontProducts({ search, category, page, limit });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
    if (!token || token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
