import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.MOCKUP_CALIBRATION_ENABLED !== "true") {
    return NextResponse.json({ error: "Mockup calibration is disabled." }, { status: 403 });
  }

  const adminKey = process.env.MOCKUP_CALIBRATION_KEY;
  const incoming = req.headers.get("x-admin-key");

  if (adminKey && incoming !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { placements?: unknown };
  try {
    body = (await req.json()) as { placements?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.placements || typeof body.placements !== "object") {
    return NextResponse.json({ error: "placements payload is required." }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "lib/mockups/placements.json");
  const serialized = `${JSON.stringify(body.placements, null, 2)}\n`;
  await writeFile(filePath, serialized, "utf8");
  return NextResponse.json({ ok: true, path: "lib/mockups/placements.json" });
}
