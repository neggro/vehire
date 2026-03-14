import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ["/dashboard", "/driver", "/admin", "/booking"];
  // /host dashboard routes (exact or known subroutes) — but not /host/[id] (public profile)
  const hostDashboardPaths = ["/host/bookings", "/host/onboarding", "/host/settings", "/host/vehicles"];
  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    protectedPaths.some((path) => pathname.startsWith(path)) ||
    pathname === "/host" ||
    hostDashboardPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath && !user) {
    // Redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Admin role check is NOT done here because middleware runs on Edge Runtime
  // and cannot use Prisma. Instead, admin authorization is enforced by:
  //   1. Admin layout (server component) — checks ADMIN role via Prisma, redirects if not admin
  //   2. API routes — requireAdmin() helper checks role + granular permissions via Prisma
  // The middleware only ensures the user is authenticated for /admin routes (handled above).

  // Security headers
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  supabaseResponse.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  return supabaseResponse;
}
