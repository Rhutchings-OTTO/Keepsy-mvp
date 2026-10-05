import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { setUnsubscribedByToken } from "@/lib/crm/contacts";
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!/^[a-f0-9]{48}$/.test(token))
    return Response.json({ error: "Invalid link" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db)
    return Response.json({ error: "Try again shortly" }, { status: 503 });
  try {
    const result = await setUnsubscribedByToken(db, token);
    return Response.json({ ok: result.ok }, { status: result.ok ? 200 : 404 });
  } catch {
    return Response.json({ error: "Try again shortly" }, { status: 503 });
  }
}
