import { NextResponse } from "next/server";
import { STAFF_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
