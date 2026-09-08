/**
 * Saved designs for the signed-in customer.
 *   GET    → list (newest first)
 *   POST   → save { imageUrl, designUrl?, prompt?, sourceKind?, width?, height? }
 *   DELETE → remove ?id=…
 *
 * Uses the caller's own session (RLS: user_id = auth.uid()). Never the
 * service role. 401 for guests, 503 when auth is not configured.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate } from "@/lib/http/validate";

export const dynamic = "force-dynamic";

const httpsUrl = z.string().url().max(2048).refine((u) => u.startsWith("https://"), "Must be https");

const saveSchema = z
  .object({
    imageUrl: httpsUrl,
    designUrl: httpsUrl.optional().nullable(),
    prompt: z.string().max(1500).optional().nullable(),
    sourceKind: z.enum(["ai", "original"]).optional().nullable(),
    width: z.number().int().positive().optional().nullable(),
    height: z.number().int().positive().optional().nullable(),
  })
  .strict();

async function requireUser(): Promise<{ error: NextResponse } | { supabase: SupabaseClient; user: User }> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: NextResponse.json({ error: "AUTH_NOT_CONFIGURED", message: "Accounts aren't switched on yet." }, { status: 503 }) };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: NextResponse.json({ error: "UNAUTHENTICATED", message: "Please sign in." }, { status: 401 }) };
  return { supabase, user: data.user };
}

export async function GET(req: Request) {
  const rl = await guardRateLimit(req, "/api/account/designs", "GET", getRequestId(req));
  if ("response" in rl) return rl.response;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("saved_designs")
    .select("id, image_url, design_url, prompt, source_kind, width, height, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return NextResponse.json({ error: "FETCH_FAILED", message: "Couldn't load your designs." }, { status: 500, headers: rl.headers });
  return NextResponse.json({ designs: data ?? [] }, { headers: rl.headers });
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/account/designs", requestId);
  if (originDeny) return originDeny;
  const rl = await guardRateLimit(req, "/api/account/designs", "POST", requestId);
  if ("response" in rl) return rl.response;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const parsed = await parseAndValidate(req, saveSchema, 16 * 1024);
  if ("error" in parsed) return NextResponse.json(parsed.error, { status: parsed.status, headers: rl.headers });
  const body = parsed.data;

  // Idempotent on (user, design_url|image_url): re-saving the same design returns the existing row.
  const matchUrl = body.designUrl ?? body.imageUrl;
  const { data: existing } = await auth.supabase
    .from("saved_designs")
    .select("id")
    .or(`design_url.eq.${matchUrl},image_url.eq.${matchUrl}`)
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ id: existing.id, created: false }, { headers: rl.headers });

  const { data, error } = await auth.supabase
    .from("saved_designs")
    .insert({
      user_id: auth.user.id,
      image_url: body.imageUrl,
      design_url: body.designUrl ?? null,
      prompt: body.prompt ?? null,
      source_kind: body.sourceKind ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "SAVE_FAILED", message: "Couldn't save that design." }, { status: 500, headers: rl.headers });
  return NextResponse.json({ id: data.id, created: true }, { status: 201, headers: rl.headers });
}

export async function DELETE(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/account/designs", requestId);
  if (originDeny) return originDeny;
  const rl = await guardRateLimit(req, "/api/account/designs", "DELETE", requestId);
  if ("response" in rl) return rl.response;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400, headers: rl.headers });

  const { error } = await auth.supabase.from("saved_designs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500, headers: rl.headers });
  return NextResponse.json({ ok: true }, { headers: rl.headers });
}
