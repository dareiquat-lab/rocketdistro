import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { passkey } = await request.json();

  if (typeof passkey !== "string" || passkey.trim().toLowerCase() !== "rocket") {
    return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("rd-pass", "rocket", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
