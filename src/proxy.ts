import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/auth");
  const isApiRoute = pathname.startsWith("/api");
  
  // Exclude static files, public routes, auth API, and next internals
  if (
    isApiRoute ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  let session = null;
  if (token) {
    session = await verifyToken(token);
  }

  // Redirect to dashboard if trying to access /auth or / while logged in
  if (session && (isAuthRoute || pathname === "/")) {
    const rolePath = session.role.toLowerCase();
    return NextResponse.redirect(new URL(`/${rolePath}`, request.url));
  }

  // Redirect to login if trying to access protected routes without session
  if (!session && !isAuthRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Role-based protection
  if (session) {
    if (pathname.startsWith("/donor") && session.role !== "Donor") {
      return NextResponse.redirect(new URL(`/${session.role.toLowerCase()}`, request.url));
    }
    if (pathname.startsWith("/volunteer") && session.role !== "Volunteer") {
      return NextResponse.redirect(new URL(`/${session.role.toLowerCase()}`, request.url));
    }
    if (pathname.startsWith("/admin") && session.role !== "Admin") {
      return NextResponse.redirect(new URL(`/${session.role.toLowerCase()}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
