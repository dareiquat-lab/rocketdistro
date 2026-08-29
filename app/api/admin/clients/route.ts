import { NextRequest, NextResponse } from "next/server";
import { getClients, createClient } from "@/lib/db";
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
    const search = searchParams.get("search") ?? "";
    const clientType = searchParams.get("clientType") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "25");

    const result = await getClients({ search, clientType, page, limit });
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
    if (!token || token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.business_name) return NextResponse.json({ error: "Business name required" }, { status: 400 });
    const client = await createClient(body);
    return NextResponse.json(client, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
