import { ImageResponse } from "next/og";
import { BrandBadge } from "./_social/BrandBadge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(120deg, #f7f1eb 0%, #f8c8dc 45%, #7db9e8 100%)",
          color: "#23211f",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          <BrandBadge />
          keepsy
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.03em" }}>
            Keep what matters.
          </div>
          <div style={{ fontSize: 50, fontWeight: 700, lineHeight: 1.1 }}>
            Turn it into a gift.
          </div>
          <div style={{ fontSize: 30, opacity: 0.82 }}>
            AI-powered keepsakes on premium tees, mugs, cards, and hoodies
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, opacity: 0.8 }}>
          <span>keepsy.store</span>
          <span>Made with love + AI</span>
        </div>
      </div>
    ),
    size
  );
}
