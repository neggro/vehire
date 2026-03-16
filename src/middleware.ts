import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run intl middleware first (handles locale detection/redirect/rewrite)
  const intlResponse = intlMiddleware(request);

  // Run Supabase session middleware (auth refresh + protected routes)
  const supabaseResponse = await updateSession(request);

  // If Supabase middleware returned a redirect (e.g., to login), use that
  if (supabaseResponse.headers.get("Location")) {
    // Copy intl cookies to the redirect response
    intlResponse.cookies.getAll().forEach((cookie) => {
      supabaseResponse.cookies.set(cookie.name, cookie.value);
    });
    return supabaseResponse;
  }

  // Otherwise use the intl response and merge Supabase cookies/headers
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  // Copy security headers from Supabase middleware
  const securityHeaders = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ];
  securityHeaders.forEach((header) => {
    const value = supabaseResponse.headers.get(header);
    if (value) {
      intlResponse.headers.set(header, value);
    }
  });

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
