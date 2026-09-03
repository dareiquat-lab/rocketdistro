import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, STAFF_COOKIE } from "@/lib/auth-utils";

const PASS_COOKIE = "rd-pass";
const PASS_VALUE  = "rocket";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old admin login to unified portal
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }
  }

  if (pathname.startsWith("/staff")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    // Admin visiting any /staff page gets sent to admin dashboard
    if (adminToken) return NextResponse.redirect(new URL("/admin", request.url));
    // Login page is always accessible for staff
    if (pathname === "/staff/login") return NextResponse.next();
    // All other /staff pages require a staff token
    const staffToken = request.cookies.get(STAFF_COOKIE)?.value;
    if (!staffToken) return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  // Storefront passkey gate — skip gateway itself and admin/staff routes
  if (
    !pathname.startsWith("/gateway") &&
    !pathname.startsWith("/api/gateway") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/staff")
  ) {
    const pass = request.cookies.get(PASS_COOKIE)?.value;
    if (pass !== PASS_VALUE) {
      return NextResponse.redirect(new URL("/gateway", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
