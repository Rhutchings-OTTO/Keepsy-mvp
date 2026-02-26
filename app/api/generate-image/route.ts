import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Using OpenAI Images API (base64 output)
    // Docs: Image generation guide + Images methods. :contentReference[oaicite:4]{index=4}
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // Use a supported image model for your account (example shown in docs includes GPT image models). :contentReference[oaicite:5]{index=5}
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json({ error: data?.error?.message || "OpenAI error" }, { status: 500 });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "No image returned" }, { status: 500 });

    const imageDataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ imageDataUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}