import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { placements } from "@/lib/mockups/placements";
import { guardRateLimit, getRequestId } from "@/lib/security/withSecurity";

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const rl = guardRateLimit(req, "/api/mockup-placements", "GET", requestId);
  if ("response" in rl) return rl.response;
  try {
    const filePath = path.join(process.cwd(), "lib/mockups/placements.json");
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    return NextResponse.json({ ok: true, placements: json });
  } catch {
    return NextResponse.json({ ok: true, placements });
  }
}
