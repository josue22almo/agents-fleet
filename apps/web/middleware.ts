import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/invite"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root path serves the presentation landing page
  if (pathname === "/") return NextResponse.next();

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Client-side auth uses localStorage, so middleware can't check tokens.
  // The AuthProvider handles redirect to /login on the client side.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
