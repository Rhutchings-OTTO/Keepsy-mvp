type BrandBadgeProps = {
  size?: number;
  fontSize?: number;
};

export function BrandBadge({ size = 68, fontSize = 36 }: BrandBadgeProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.88)",
        border: "2px solid rgba(35,33,31,0.12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <span style={{ fontSize, fontWeight: 800, lineHeight: 1 }}>K</span>
    </div>
  );
}
