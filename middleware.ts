import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "rd_admin_token";
const STAFF_COOKIE = "rd_staff_token";

async function computeHash(prefix: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${prefix}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const expected = await computeHash("rocket-distro-admin", process.env.ADMIN_PASSWORD || "");
    if (!token || token !== expected) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/staff") && !pathname.startsWith("/staff/login")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    const staffToken = request.cookies.get(STAFF_COOKIE)?.value;
    const expectedAdmin = await computeHash("rocket-distro-admin", process.env.ADMIN_PASSWORD || "");
    const expectedStaff = await computeHash("rocket-distro-staff", "rocketstaff");
    const authorized =
      (adminToken && adminToken === expectedAdmin) ||
      (staffToken && staffToken === expectedStaff);
    if (!authorized) {
      const url = request.nextUrl.clone();
      url.pathname = "/staff/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
