/**
 * TEMPORARY test endpoint — remove once mug print positioning is confirmed working.
 *
 * GET /api/test-mug-wrap?url=<imageUrl>
 *
 * Calls compositeMugImage and returns the full 2582×1120 px flat wrap PNG
 * directly so you can visually inspect the front (Q1) and back (Q4) design
 * placement relative to the full print area.
 */

import { NextRequest, NextResponse } from "next/server";
import { compositeMugImage } from "@/lib/image-composite";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing ?url= query parameter" }, { status: 400 });
  }

  try {
    const buf = await compositeMugImage(url);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(buf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
