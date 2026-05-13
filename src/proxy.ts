import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/stickers/:path*",
    "/search/:path*",
    "/stats/:path*",
    "/family/:path*",
    "/api/stickers/:path*",
    "/api/dashboard/:path*",
    "/api/family/:path*",
  ],
};
