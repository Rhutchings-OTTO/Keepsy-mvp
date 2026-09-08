import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/tests/helpers/fakeSupabase";

const state = vi.hoisted(() => ({ supabase: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: async () => state.supabase }));

import { GET, POST, DELETE } from "./route";

const design = "https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/abc.png";

function req(method: string, body?: unknown, query = "") {
  return new Request(`https://keepsy.store/api/account/designs${query}`, {
    method,
    headers: { "Content-Type": "application/json", Origin: "https://keepsy.store", "x-visitor-id": `v-${Math.random()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
}

let db: FakeSupabase;
beforeEach(() => {
  db = createFakeSupabase({}, { id: "user-1", email: "a@b.c" });
  state.supabase = db;
});

describe("/api/account/designs", () => {
  it("returns 503 when auth is not configured and 401 for guests — never falls back to an email lookup", async () => {
    state.supabase = null;
    expect((await GET(req("GET"))).status).toBe(503);
    state.supabase = createFakeSupabase({}, null);
    expect((await GET(req("GET"))).status).toBe(401);
    expect((await POST(req("POST", { imageUrl: design }))).status).toBe(401);
  });

  it("saves a design for the signed-in user with the user's own client (RLS), idempotently", async () => {
    const first = await POST(req("POST", { imageUrl: design, designUrl: design, prompt: "fox", sourceKind: "ai", width: 1024, height: 1024 }));
    expect(first.status).toBe(201);
    expect(db.tables.saved_designs).toHaveLength(1);
    expect(db.tables.saved_designs[0]).toMatchObject({ user_id: "user-1", design_url: design, prompt: "fox" });

    const list = await GET(req("GET"));
    expect((await list.json()).designs).toHaveLength(1);
  });

  it("rejects data URLs and non-https images", async () => {
    const res = await POST(req("POST", { imageUrl: "data:image/png;base64,AAAA" }));
    expect(res.status).toBe(400);
  });

  it("deletes by id and validates the id shape", async () => {
    db.tables.saved_designs = [{ id: "3b241101-e2bb-4255-8caf-4136c566a962", user_id: "user-1", image_url: design }];
    expect((await DELETE(req("DELETE", undefined, "?id=not-a-uuid"))).status).toBe(400);
    const ok = await DELETE(req("DELETE", undefined, "?id=3b241101-e2bb-4255-8caf-4136c566a962"));
    expect(ok.status).toBe(200);
    expect(db.tables.saved_designs).toHaveLength(0);
  });
});
