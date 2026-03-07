import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID().slice(0, 8);
  const response = NextResponse.next();
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
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.supabase.in https://inn.gs https://*.inngest.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://picsum.photos",
    "style-src 'self' 'unsafe-inline'",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);
  return response;
}
