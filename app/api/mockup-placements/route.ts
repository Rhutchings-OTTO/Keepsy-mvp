import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { placements } from "@/lib/mockups/placements";
import { guardRateLimit, getRequestId } from "@/lib/security/withSecurity";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const rl = await guardRateLimit(req, "/api/mockup-placements", "GET", requestId);
  if ("response" in rl) return rl.response;
  const cacheHeaders = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
  try {
    const filePath = path.join(process.cwd(), "lib/mockups/placements.json");
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    return NextResponse.json({ ok: true, placements: json }, { headers: cacheHeaders });
  } catch {
    return NextResponse.json({ ok: true, placements }, { headers: cacheHeaders });
  }
}
