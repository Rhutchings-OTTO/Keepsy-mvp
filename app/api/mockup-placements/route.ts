import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { placements } from "@/lib/mockups/placements";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "lib/mockups/placements.json");
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    return NextResponse.json({ ok: true, placements: json });
  } catch {
    return NextResponse.json({ ok: true, placements });
  }
}
