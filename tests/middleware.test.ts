/**
 * Route protection: /account/* redirects guests to sign-in when auth is
 * configured, public auth screens stay reachable, and nothing changes when
 * auth is not configured (guest purchasing must keep working).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({ user: null as null | { id: string }, configured: true }));
vi.mock("@/lib/supabase/middleware", async () => {
  const { NextResponse } = await import("next/server");
  return {
    refreshSupabaseSession: async (req: NextRequest) => ({ response: NextResponse.next({ request: req }), user: state.user, configured: state.configured }),
  };
});

import { middleware } from "@/middleware";

function run(path: string) {
  return middleware(new NextRequest(`https://keepsy.store${path}`));
}

beforeEach(() => {
  state.user = null;
  state.configured = true;
});

describe("middleware", () => {
  it("redirects guests away from the account dashboard to sign-in with a return path", async () => {
    const res = await run("/account");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://keepsy.store/account/sign-in?next=%2Faccount");
  });

  it("lets guests reach the public auth screens", async () => {
    for (const p of ["/account/sign-in", "/account/sign-up", "/account/forgot-password", "/account/reset-password"]) {
      const res = await run(p);
      expect(res.status, p).toBe(200);
    }
  });

  it("lets signed-in customers through and keeps security headers", async () => {
    state.user = { id: "u1" };
    const res = await run("/account");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-security-policy")).toContain("https://api.cloudinary.com");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });

  it("does not redirect when auth is not configured (page renders its own honest message)", async () => {
    state.configured = false;
    const res = await run("/account");
    expect(res.status).toBe(200);
  });

  it("never touches guest checkout routes", async () => {
    const res = await run("/create");
    expect(res.status).toBe(200);
  });
});
