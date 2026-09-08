import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";
import { ACCOUNT_PATHS, PUBLIC_ACCOUNT_PATHS } from "@/lib/supabase/config";

function applySecurityHeaders(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    // api.cloudinary.com: direct (signed) uploads of original photos from the browser.
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.supabase.in https://inn.gs https://*.inngest.com https://api.cloudinary.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://*.supabase.in https://images.unsplash.com https://picsum.photos",
    "style-src 'self' 'unsafe-inline'",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);
}

export async function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID().slice(0, 8);
  const { pathname } = req.nextUrl;

  // Refresh the Supabase session cookie (no-op when auth is not configured).
  const { response, user, configured } = await refreshSupabaseSession(req);

  // Protect the customer account area. Public auth screens stay reachable.
  const isAccountPath = pathname === ACCOUNT_PATHS.home || pathname.startsWith(`${ACCOUNT_PATHS.home}/`);
  if (configured && isAccountPath && !PUBLIC_ACCOUNT_PATHS.has(pathname) && !user) {
    const signIn = req.nextUrl.clone();
    signIn.pathname = ACCOUNT_PATHS.signIn;
    signIn.search = `?next=${encodeURIComponent(pathname)}`;
    const redirect = NextResponse.redirect(signIn);
    applySecurityHeaders(redirect, requestId);
    return redirect;
  }

  applySecurityHeaders(response, requestId);
  return response;
}

export const config = {
  // Skip static assets; everything else gets security headers + session refresh.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|webmanifest)$).*)"],
};
