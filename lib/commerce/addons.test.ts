import "@/tests/browserStorage";
import { describe, it, expect, beforeEach } from "vitest";
import { buildAddonLine, findAddonLines, getAddonOffers } from "./addons";
import { __resetCartStoreForTests, addLine, getCart, mergeLine, removeFromCart, type CartLine } from "@/lib/cart/store";

const design = "https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/abc.png";

const hoodie: Omit<CartLine, "id"> = {
  productId: "hoodie",
  name: "Hoodie",
  color: "Black",
  size: "L",
  imageUrl: design,
  designUrl: design,
  sourceKind: "original",
  sourceWidth: 3000,
  sourceHeight: 2000,
  unitPrice: 44.99,
  quantity: 1,
};

beforeEach(() => {
  __resetCartStoreForTests();
  window.localStorage.clear();
});

describe("getAddonOffers", () => {
  it("offers a UK postcard and a second print priced from the server catalogue", () => {
    const lines = mergeLine([], hoodie);
    const offers = getAddonOffers(lines, "UK");
    expect(offers.map((o) => o.id)).toEqual(["matching-card", "second-print"]);
    expect(offers[0]).toMatchObject({ productId: "postcard", unitPrice: 6.99, currency: "gbp", needsSize: false });
    expect(offers[1]).toMatchObject({ productId: "hoodie", unitPrice: 44.99, needsSize: true, defaultSize: "L" });
    expect(offers[1].sizeOptions).toEqual(["S", "M", "L", "XL", "2XL", "3XL"]);
  });

  it("offers the US greeting card in USD for US baskets", () => {
    const offers = getAddonOffers(mergeLine([], hoodie), "US");
    expect(offers[0]).toMatchObject({ productId: "uscard_1", unitPrice: 9.99, currency: "usd" });
    expect(offers[1].unitPrice).toBe(59.99);
  });

  it("does not offer a matching card when the basket already IS that card, and nothing for an empty basket", () => {
    const postcard: Omit<CartLine, "id"> = { productId: "postcard", name: "Fine Art Postcard", imageUrl: design, designUrl: design, unitPrice: 6.99, quantity: 1 };
    const offers = getAddonOffers(mergeLine([], postcard), "UK");
    expect(offers.map((o) => o.id)).toEqual(["second-print"]);
    expect(offers[0].needsSize).toBe(false);
    expect(getAddonOffers([], "UK")).toEqual([]);
  });
});

describe("buildAddonLine + basket round trip", () => {
  it("adds a correctly priced, fulfilment-valid card carrying the primary design; repeat toggles remove it", () => {
    addLine(hoodie);
    const offers = getAddonOffers(getCart(), "UK");
    const card = buildAddonLine(offers[0], getCart())!;
    expect(card).toMatchObject({ productId: "postcard", unitPrice: 6.99, designUrl: design, sourceKind: "original", addonId: "matching-card", quantity: 1 });
    addLine(card);
    expect(findAddonLines(getCart(), "matching-card")).toHaveLength(1);

    // Clicking again (same offer) must not duplicate — the drawer removes instead.
    addLine(card);
    expect(findAddonLines(getCart(), "matching-card")).toHaveLength(1);
    expect(findAddonLines(getCart(), "matching-card")[0].quantity).toBe(2); // merge, not duplicate line
    findAddonLines(getCart(), "matching-card").forEach((l) => removeFromCart(l.id));
    expect(findAddonLines(getCart(), "matching-card")).toHaveLength(0);
    expect(getCart()).toHaveLength(1); // primary untouched
  });

  it("requires a size for a second apparel print and defaults to the primary size", () => {
    addLine(hoodie);
    const offer = getAddonOffers(getCart(), "UK")[1];
    const withDefault = buildAddonLine(offer, getCart())!;
    expect(withDefault.size).toBe("L");
    expect(withDefault.color).toBe("Black");
    const withOther = buildAddonLine(offer, getCart(), "XL")!;
    expect(withOther.size).toBe("XL");
    const noSize = buildAddonLine({ ...offer, defaultSize: undefined }, getCart());
    expect(noSize).toBeNull();
  });

  it("keeps add-on lines across a reload (basket is the state)", () => {
    addLine(hoodie);
    const offer = getAddonOffers(getCart(), "UK")[0];
    addLine(buildAddonLine(offer, getCart())!);
    __resetCartStoreForTests();
    expect(findAddonLines(getCart(), "matching-card")).toHaveLength(1);
  });
});
