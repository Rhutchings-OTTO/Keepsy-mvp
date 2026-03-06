import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseJsonSafe } from "@/lib/http/validate";

export const runtime = "nodejs";

const MAX_PLACEMENTS_BODY = 1 * 1024 * 1024; // 1MB

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const rl = await guardRateLimit(req, "/api/admin/mockup-placements", "POST", requestId);
  if ("response" in rl) return rl.response;

  if (process.env.MOCKUP_CALIBRATION_ENABLED !== "true") {
    return NextResponse.json({ error: "Mockup calibration is disabled." }, { status: 403 });
  }

  const adminKey = process.env.MOCKUP_CALIBRATION_KEY;
  const incoming = req.headers.get("x-admin-key");

  if (adminKey && incoming !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonSafe(req, MAX_PLACEMENTS_BODY);
  if ("error" in parsed) {
    return NextResponse.json(parsed.error, { status: parsed.status });
  }
  const body = parsed.data as { placements?: unknown };

  if (!body.placements || typeof body.placements !== "object") {
    return NextResponse.json({ error: "placements payload is required." }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "lib/mockups/placements.json");
  const serialized = `${JSON.stringify(body.placements, null, 2)}\n`;
  await writeFile(filePath, serialized, "utf8");
  return NextResponse.json({ ok: true, path: "lib/mockups/placements.json" });
}
