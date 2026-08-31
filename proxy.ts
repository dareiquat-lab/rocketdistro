import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, STAFF_COOKIE } from "@/lib/auth-utils";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/staff/login") return NextResponse.next();

  if (pathname.startsWith("/staff")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    const staffToken = request.cookies.get(STAFF_COOKIE)?.value;
    if (!adminToken && !staffToken) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
