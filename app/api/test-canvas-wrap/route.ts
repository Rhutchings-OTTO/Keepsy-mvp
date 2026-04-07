/**
 * TEMPORARY test endpoint — remove once canvas gallery wrap is confirmed working.
 *
 * GET /api/test-canvas-wrap?url=<imageUrl>&size=20x16
 *
 * Calls compositeCanvasImage and returns the PNG directly so you can visually
 * inspect the gallery wrap in a browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { compositeCanvasImage } from "@/lib/image-composite";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url  = req.nextUrl.searchParams.get("url");
  const size = req.nextUrl.searchParams.get("size") ?? "20x16";

  if (!url) {
    return NextResponse.json({ error: "Missing ?url= query parameter" }, { status: 400 });
  }

  try {
    const buf = await compositeCanvasImage(url, size);
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
