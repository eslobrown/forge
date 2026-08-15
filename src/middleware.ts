import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, expectedToken, tokensMatch } from "@/lib/auth-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API through unconditionally
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // expectedToken() is null when SITE_PASSWORD is unset — deny rather than
  // fall back to a guessable value. See src/lib/auth-token.ts.
  const expected = await expectedToken();
  if (expected && tokensMatch(request.cookies.get(AUTH_COOKIE)?.value, expected)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
