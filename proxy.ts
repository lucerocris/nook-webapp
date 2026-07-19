import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            supabaseResponse.headers.set(key, value);
          }
        },
      },
    },
  );

  // An unreachable auth endpoint must not take the whole site down. This
  // middleware matches nearly every request, so an unguarded throw here turns a
  // transient Supabase blip into a site-wide 500 — including on pages that
  // need no auth at all. Failing to refresh degrades to "logged out", which is
  // strictly better.
  try {
    await supabase.auth.getClaims();
  } catch (error) {
    console.error("[proxy] auth refresh failed", error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Skips:
     *  - _next internals and image/icon assets
     *  - `api/` — route handlers read their own session where needed, and this
     *    middleware was adding a Supabase round trip to every /api/search/cafes
     *    call (one per keystroke in the search dropdown)
     *  - json/txt/xml — mapstyle.json, robots.txt and sitemap.xml are static
     *    and were each paying for an auth refresh
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)",
  ],
};
