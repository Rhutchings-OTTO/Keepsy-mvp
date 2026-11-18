import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/safety/thinModeration", () => ({
  moderatePrompt: vi.fn(async (prompt: string) => ({ ok: true, prompt })),
}));
vi.mock("@/lib/uploadImage", () => ({
  uploadImageToCloudinary: vi.fn(async () => ({ ok: true, url: "https://example.com/design.png" })),
}));
vi.mock("@/app/api/generate-image/guardrails", () => ({ fetchWithBackoff: vi.fn() }));

import { fetchWithBackoff } from "@/app/api/generate-image/guardrails";
import { baselineGenerate } from "./baselineGenerate";

const fetchMock = vi.mocked(fetchWithBackoff);
const input = { prompt: "A watercolor dog", size: "1024x1536" as const, clientId: "test" };

beforeEach(() => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ b64_json: "aW1hZ2U=" }] }), { status: 200 }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("image model migration", () => {
  it.each([undefined, "gpt-image-1", "  gpt-image-1  "])("uses the supported model for generation when configured as %s", async (model) => {
    vi.stubEnv("OPENAI_IMAGE_MODEL", model ?? "");
    if (model === undefined) delete process.env.OPENAI_IMAGE_MODEL;
    const result = await baselineGenerate({ ...input, mode: "describe" });
    expect(result).toMatchObject({ ok: true, imageDataUrl: "data:image/png;base64,aW1hZ2U=", designUrl: "https://example.com/design.png" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/generations");
    expect(JSON.parse(init.body as string)).toMatchObject({ model: "gpt-image-2.5-sunburst", size: input.size, quality: "high" });
  });

  it("uses the same migrated model for photo edits", async () => {
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-1");
    const result = await baselineGenerate({ ...input, mode: "upload", referenceImageDataUrl: "data:image/png;base64,aW1hZ2U=" });
    expect(result).toMatchObject({ ok: true, imageDataUrl: "data:image/png;base64,aW1hZ2U=" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/edits");
    const body = init.body as FormData;
    expect(body.get("model")).toBe("gpt-image-2.5-sunburst");
    expect(body.get("size")).toBe(input.size);
    expect(body.get("image")).toBeInstanceOf(Blob);
  });

  it("preserves an explicitly configured supported model", async () => {
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-2.5-flare");
    await baselineGenerate({ ...input, mode: "describe" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).model).toBe("gpt-image-2.5-flare");
  });
});
