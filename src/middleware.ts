export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/guardian/:path*",
    "/bursar/:path*",
    "/library/:path*",
    "/transport/:path*",
  ],
};
