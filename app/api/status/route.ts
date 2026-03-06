import { NextResponse } from "next/server";
import { getGenerationMetrics } from "@/app/api/generate-image/metrics";

/** Panic = generation capacity at or above ~90% (7/8 in-flight) */
const PANIC_THRESHOLD_IN_FLIGHT = 7;

export const dynamic = "force-dynamic";
export const runtime = "edge";

/** Public status endpoint. Returns only a panic flag for the Easter egg. Use ?demo=1 to force panic for testing. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const demo = searchParams.get("demo") === "1";
  const m = getGenerationMetrics();
  const panic = demo || m.inFlightCount >= PANIC_THRESHOLD_IN_FLIGHT;

  return NextResponse.json(
    { panic, at: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=2, s-maxage=2" } }
  );
}
