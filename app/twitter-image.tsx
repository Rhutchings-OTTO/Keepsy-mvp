import { ImageResponse } from "next/og";
import { BrandBadge } from "./_social/BrandBadge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
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
          background: "linear-gradient(120deg, #f7f1eb 0%, #ffd194 40%, #b19cd9 100%)",
          color: "#23211f",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandBadge size={52} fontSize={28} />
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>keepsy</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
            Memories into
          </div>
          <div style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
            beautiful gifts
          </div>
          <div style={{ fontSize: 30, opacity: 0.82 }}>Create custom keepsakes in minutes at keepsy.store</div>
        </div>

        <div style={{ fontSize: 24, opacity: 0.8 }}>Tees · Mugs · Cards · Hoodies</div>
      </div>
    ),
    size
  );
}
