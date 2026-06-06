import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname === "/login";
  
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", req.nextUrl));
    }
    return null;
  }

  if (!isLoggedIn) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return Response.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.nextUrl)
    );
  }

  // Rutas protegidas por rol
  const role = req.auth?.user?.role;
  
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return Response.redirect(new URL("/", req.nextUrl));
  }
  
  // Aquí podemos agregar más restricciones por rol según avance la app

  return null;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
