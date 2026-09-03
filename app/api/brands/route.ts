import { NextResponse } from "next/server";
import { getBrandWithProductCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await getBrandWithProductCount();
    const active = brands.filter((b) => b.product_count > 0);
    return NextResponse.json(active);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
