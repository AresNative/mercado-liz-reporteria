import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Simula decodificación del token
  const role =
    token === "admin-token" ? "admin" : token === "user-token" ? "user" : null;

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

// Rutas protegidas
export const config = {
  matcher: ["/admin/:path*", "/reporteria/:path*", "/model/:path*"],
};
