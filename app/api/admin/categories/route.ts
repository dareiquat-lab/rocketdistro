import { NextRequest, NextResponse } from "next/server";
import { getCategories, getCategoryWithProductCount, createCategory } from "@/lib/db";
import { cookies } from "next/headers";
import { computeAdminToken, ADMIN_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    const expected = await computeAdminToken(process.env.ADMIN_PASSWORD || "");
    if (!token || token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const withCount = searchParams.get("withCount") === "true";
    const cats = withCount ? await getCategoryWithProductCount() : await getCategories();
    return NextResponse.json(cats);
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
    if (!token || token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, icon } = body;
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const cat = await createCategory(name, description ?? null, icon ?? "📦");
    return NextResponse.json(cat, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
