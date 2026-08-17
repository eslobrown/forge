import { NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth-token";

export async function POST(request: Request) {
  // This is the one endpoint the middleware lets through unauthenticated, so it
  // receives whatever the internet sends it. An unparseable body threw here and
  // surfaced as a 500; a malformed request is the client's error, not ours.
  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  if (!process.env.SITE_PASSWORD || password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Same derivation the middleware checks against — see src/lib/auth-token.ts.
  // Should be non-null (SITE_PASSWORD was just verified), but never issue a
  // cookie we cannot derive: an empty cookie would not match anyway, and this
  // keeps the failure a clean 401 rather than a redirect loop at /login.
  const token = await expectedToken();
  if (!token) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
