import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = ["/login", "/signup", "/auth"];

/** Routes reachable without a session. Everything else requires one. */
function isPublic(path: string) {
  return path === "/" || AUTH_ROUTES.some((r) => path.startsWith(r));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Refreshes the token and tells us whether the session is genuinely valid,
  // rather than merely whether a cookie is lying around.
  const { response, user } = await updateSession(request);

  if (!user && !isPublic(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Only round-trip in-app paths, and never a bare "/" — an open redirect
    // here would let a crafted link bounce someone off-site after sign-in.
    if (path !== "/" && path.startsWith("/") && !path.startsWith("//")) {
      url.searchParams.set("next", path + request.nextUrl.search);
    }
    return NextResponse.redirect(url);
  }

  // Signed in and sitting on a sign-in screen: send them somewhere useful.
  // /auth is excluded because callbacks must be allowed to complete.
  if (user && (path.startsWith("/login") || path.startsWith("/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
