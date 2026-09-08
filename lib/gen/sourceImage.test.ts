import { describe, it, expect, vi, afterEach } from "vitest";
import sharp from "sharp";
import { isAllowedSourceUrl, resolveSourceImage } from "./sourceImage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveSourceImage", () => {
  it("passes PNG/JPEG data URLs through untouched", async () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    expect(await resolveSourceImage({ dataUrl: png })).toEqual({ ok: true, dataUrl: png });
  });

  it("converts a WebP data URL to PNG so the edit endpoint accepts it", async () => {
    const webp = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#C4714A" } }).webp().toBuffer();
    const res = await resolveSourceImage({ dataUrl: `data:image/webp;base64,${webp.toString("base64")}` });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    const meta = await sharp(Buffer.from(res.dataUrl.split(",")[1], "base64")).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(4);
  });

  it("rejects GIF/SVG data URLs with a readable message", async () => {
    const res = await resolveSourceImage({ dataUrl: "data:image/gif;base64,R0lGODlh" });
    expect(res).toMatchObject({ ok: false });
  });

  it("only fetches https URLs on our Cloudinary host (history nodes), never arbitrary hosts", async () => {
    expect(isAllowedSourceUrl("https://res.cloudinary.com/demo/image/upload/v1/x.png")).toBe(true);
    expect(isAllowedSourceUrl("http://res.cloudinary.com/demo/image/upload/v1/x.png")).toBe(false);
    expect(isAllowedSourceUrl("https://evil.example.com/x.png")).toBe(false);
    const res = await resolveSourceImage({ url: "https://evil.example.com/x.png" });
    expect(res).toMatchObject({ ok: false });
  });

  it("fetches an allowed URL and returns a PNG/JPEG data URL", async () => {
    const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#2C4A3E" } }).jpeg().toBuffer();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(jpeg), { status: 200, headers: { "content-type": "image/jpeg" } })));
    const res = await resolveSourceImage({ url: "https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/a.jpg" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
  });
});
