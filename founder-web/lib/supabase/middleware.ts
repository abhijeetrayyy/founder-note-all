import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the session and persist the result onto the response.
 *
 * This is the only place cookies can actually be written on a normal page
 * request: `lib/supabase/server.ts` swallows its writes because Server
 * Components are not allowed to set them. Without this running, a refreshed
 * access token is computed and then thrown away on every request — and once the
 * rotating refresh token moves on, the session dies outright.
 *
 * It also answers "is this person signed in?" honestly. Checking for the
 * presence of a cookie cannot: an expired cookie looks identical to a valid one,
 * which is what put the app in a login/today redirect loop with no way out but
 * clearing site data by hand.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to the request so anything downstream in this pass sees the
          // fresh token, then rebuild the response so they reach the browser.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not put anything between createServerClient and getUser: getUser is what
  // triggers the refresh, and any early return in between can log users out at
  // random in ways that are very hard to reproduce.
  const { data: { user } } = await supabase.auth.getUser();

  return { response, user };
}
