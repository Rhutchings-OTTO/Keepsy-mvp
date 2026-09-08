/**
 * The "print my photo as it is" path: signed direct upload + server-side
 * confirmation. Cloudinary's Admin API is mocked; the signature helper is real.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const cloudinaryState = vi.hoisted(() => ({
  resource: null as null | Record<string, unknown>,
  resourceCalls: [] as string[],
}));
vi.mock("cloudinary", async () => {
  const actual = await vi.importActual<typeof import("cloudinary")>("cloudinary");
  return {
    v2: {
      ...actual.v2,
      config: () => {},
      api: {
        resource: async (publicId: string) => {
          cloudinaryState.resourceCalls.push(publicId);
          if (!cloudinaryState.resource) throw new Error("not found");
          return cloudinaryState.resource;
        },
      },
    },
  };
});

import { POST as sign } from "./sign/route";
import { POST as confirm } from "./confirm/route";

function req(path: string, body: unknown) {
  return new Request(`https://keepsy.store${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://keepsy.store", "x-visitor-id": `v-${Math.random()}` },
    body: JSON.stringify(body),
  });
}

const ENV = { CLOUDINARY_CLOUD_NAME: "demo", CLOUDINARY_API_KEY: "123456", CLOUDINARY_API_SECRET: "test-secret" };

beforeEach(() => {
  Object.assign(process.env, ENV);
  cloudinaryState.resource = null;
  cloudinaryState.resourceCalls = [];
});
afterEach(() => {
  for (const k of Object.keys(ENV)) delete process.env[k];
});

describe("POST /api/upload-original/sign", () => {
  it("returns 503 with a clear message when image hosting is not configured", async () => {
    delete process.env.CLOUDINARY_API_SECRET;
    const res = await sign(req("/api/upload-original/sign", { mime: "image/jpeg", bytes: 1000 }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("IMAGE_HOSTING_NOT_CONFIGURED");
  });

  it("rejects HEIC with guidance, unsupported types and oversize files before signing anything", async () => {
    const heic = await sign(req("/api/upload-original/sign", { mime: "image/heic", bytes: 1000, fileName: "IMG_1.HEIC" }));
    expect(heic.status).toBe(400);
    expect((await heic.json()).message).toMatch(/JPEG|JPG/);
    const gif = await sign(req("/api/upload-original/sign", { mime: "image/gif", bytes: 1000 }));
    expect(gif.status).toBe(400);
    const huge = await sign(req("/api/upload-original/sign", { mime: "image/png", bytes: 26 * 1024 * 1024 }));
    expect(huge.status).toBe(400);
  });

  it("signs a direct-to-Cloudinary upload into the originals folder without exposing the secret", async () => {
    const res = await sign(req("/api/upload-original/sign", { mime: "image/png", bytes: 5_000_000, fileName: "house.png" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.uploadUrl).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    expect(body.publicId).toMatch(/^keepsy-originals\/[0-9a-f-]{36}$/);
    expect(body.fields).toMatchObject({ api_key: "123456", public_id: body.publicId, overwrite: "false" });
    expect(typeof body.fields.signature).toBe("string");
    expect(JSON.stringify(body)).not.toContain("test-secret");
  });
});

describe("POST /api/upload-original/confirm", () => {
  it("verifies the asset through the Admin API and reports honest dimensions + print quality", async () => {
    cloudinaryState.resource = {
      public_id: "keepsy-originals/abc",
      secure_url: "https://res.cloudinary.com/demo/image/upload/v123/keepsy-originals/abc.jpg",
      width: 4032,
      height: 3024,
      bytes: 3_200_000,
      format: "jpg",
    };
    const res = await confirm(req("/api/upload-original/confirm", { publicId: "keepsy-originals/abc", productId: "mug" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.width).toBe(4032);
    expect(body.url).toBe("https://res.cloudinary.com/demo/image/upload/fl_immutable_cache/v123/keepsy-originals/abc.jpg");
    expect(body.quality.rating).toBe("excellent");
    expect(cloudinaryState.resourceCalls).toEqual(["keepsy-originals/abc"]);
  });

  it("delivers WebP originals as PNG for the print pipeline", async () => {
    cloudinaryState.resource = {
      public_id: "keepsy-originals/w",
      secure_url: "https://res.cloudinary.com/demo/image/upload/v1/keepsy-originals/w.webp",
      width: 2000, height: 2000, bytes: 100, format: "webp",
    };
    const res = await confirm(req("/api/upload-original/confirm", { publicId: "keepsy-originals/w" }));
    expect((await res.json()).url).toContain("/image/upload/f_png/");
  });

  it("refuses public ids outside the originals folder and photos too small to print", async () => {
    const outside = await confirm(req("/api/upload-original/confirm", { publicId: "keepsy-designs/other" }));
    expect(outside.status).toBe(400);
    expect(cloudinaryState.resourceCalls).toEqual([]);

    cloudinaryState.resource = { secure_url: "https://res.cloudinary.com/demo/image/upload/v1/keepsy-originals/s.jpg", width: 300, height: 200, bytes: 10, format: "jpg" };
    const small = await confirm(req("/api/upload-original/confirm", { publicId: "keepsy-originals/s" }));
    expect(small.status).toBe(400);
    expect((await small.json()).error).toBe("TOO_SMALL");
  });

  it("returns 404 when the asset was never uploaded", async () => {
    const res = await confirm(req("/api/upload-original/confirm", { publicId: "keepsy-originals/missing" }));
    expect(res.status).toBe(404);
  });
});
