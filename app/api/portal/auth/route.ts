import { NextRequest, NextResponse } from "next/server";
import {
  computeAdminToken, ADMIN_COOKIE,
  computeStaffToken, STAFF_COOKIE, STAFF_PASSWORD,
  ADMIN_COOKIE_MAX_AGE,
} from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: ADMIN_COOKIE_MAX_AGE,
      path: "/",
    };

    // Try admin password first
    if (password === (process.env.ADMIN_PASSWORD || "")) {
      const token = await computeAdminToken(password);
      const response = NextResponse.json({ role: "admin" });
      response.cookies.set(ADMIN_COOKIE, token, cookieOpts);
      return response;
    }

    // Try staff password
    if (password === STAFF_PASSWORD) {
      const token = await computeStaffToken();
      const response = NextResponse.json({ role: "staff" });
      response.cookies.set(STAFF_COOKIE, token, cookieOpts);
      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
