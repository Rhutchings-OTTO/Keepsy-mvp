import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { PlacementMap } from "@/lib/mockups/placements";

export const runtime = "nodejs";

const FILE_PATH = path.join(process.cwd(), "lib", "mockups", "placements.json");

function assertAdminAccess(req: Request) {
  if (process.env.MOCKUP_CALIBRATION_ENABLED !== "true") {
    return NextResponse.json({ error: "Mockup calibration is disabled." }, { status: 403 });
  }
  const requiredKey = process.env.MOCKUP_CALIBRATION_KEY;
  if (!requiredKey) return null;
  const provided = req.headers.get("x-calibration-key") || "";
  if (provided !== requiredKey) {
    return NextResponse.json({ error: "Invalid calibration key." }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denial = assertAdminAccess(req);
  if (denial) return denial;
  try {
    const json = await readFile(FILE_PATH, "utf8");
    return NextResponse.json(JSON.parse(json));
  } catch {
    return NextResponse.json({ error: "Failed to read placements." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denial = assertAdminAccess(req);
  if (denial) return denial;
  try {
    const body = (await req.json()) as PlacementMap;
    await writeFile(FILE_PATH, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save placements." }, { status: 500 });
  }
}
