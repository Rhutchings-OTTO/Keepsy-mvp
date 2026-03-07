/**
 * WatermarkOverlay — CSS-only diagonal repeating "Keepsy" watermark.
 * Applied as a pointer-events-none absolute overlay so it doesn't
 * interfere with buttons or interactions. The underlying image files
 * remain clean; this is purely a visual deterrent against screenshots.
 *
 * Use inside any `position: relative` container.
 */
export function WatermarkOverlay() {
  const tile = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><text x='-20' y='110' font-family='Georgia, "Times New Roman", serif' font-size='24' font-weight='600' letter-spacing='3' fill='rgba(45,41,38,0.17)' transform='rotate(-35 100 100)'>Keepsy</text></svg>`;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
    />
  );
}
