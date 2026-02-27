import { NextResponse } from "next/server";
import { getGenerationMetrics } from "@/app/api/generate-image/metrics";

export async function GET() {
  const generation = getGenerationMetrics();
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    generation,
  });
}

