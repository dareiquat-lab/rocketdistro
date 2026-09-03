import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PASS_COOKIE = "rd-pass";
const PASS_VALUE  = "rocket";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/gateway") ||
    pathname.startsWith("/api/gateway") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff")
  ) {
    return NextResponse.next();
  }

  const pass = request.cookies.get(PASS_COOKIE)?.value;
  if (pass !== PASS_VALUE) {
    const url = request.nextUrl.clone();
    url.pathname = "/gateway";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
