import { describe, it, expect } from "vitest";
import { normalizeSize } from "./printify-blueprints";

describe("normalizeSize", () => {
  // Canvas dimension codes — lowercase 'x' separator must be preserved
  it("30x30 (canvas square)", () => expect(normalizeSize("30x30")).toBe("30x30"));
  it("12x12 (canvas square)", () => expect(normalizeSize("12x12")).toBe("12x12"));
  it("20x16 (canvas landscape)", () => expect(normalizeSize("20x16")).toBe("20x16"));

  // Postcard dimension codes
  it("7x5 (postcard)", () => expect(normalizeSize("7x5")).toBe("7x5"));
  it("6x4 (postcard)", () => expect(normalizeSize("6x4")).toBe("6x4"));

  // Clothing sizes — must be uppercased; 'x' inside "XL" / "2XL" / "3XL" must NOT become lowercase
  it("xl → XL (hoodie/tee)", () => expect(normalizeSize("xl")).toBe("XL"));
  it("2xl → 2XL (hoodie/tee — X between digit and letter must stay uppercase)", () => expect(normalizeSize("2xl")).toBe("2XL"));
  it("3XL already uppercase", () => expect(normalizeSize("3XL")).toBe("3XL"));

  // Edge cases
  it("undefined → empty string", () => expect(normalizeSize(undefined)).toBe(""));
  it("empty string → empty string", () => expect(normalizeSize("")).toBe(""));
});
