/**
 * WatermarkOverlay — CSS-only diagonal repeating "Keepsy" watermark.
 * Applied as a pointer-events-none absolute overlay so it doesn't
 * interfere with buttons or interactions. The underlying image files
 * remain clean; this is purely a visual deterrent against screenshots.
 *
 * Use inside any `position: relative` container.
 */
export function WatermarkOverlay() {
  // Desktop: subtle 0.17 opacity
  const desktopTile = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><text x='-20' y='110' font-family='Georgia, "Times New Roman", serif' font-size='24' font-weight='600' letter-spacing='3' fill='rgba(45,41,38,0.17)' transform='rotate(-35 100 100)'>Keepsy</text></svg>`;
  // Mobile: ~40% more visible at 0.28 opacity, slightly larger text for legibility
  const mobileTile = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><text x='-18' y='100' font-family='Georgia, "Times New Roman", serif' font-size='26' font-weight='700' letter-spacing='3' fill='rgba(45,41,38,0.28)' transform='rotate(-35 90 90)'>Keepsy</text></svg>`;

  const sharedStyle = {
    backgroundRepeat: "repeat" as const,
    backgroundSize: "200px 200px",
  };

  return (
    <>
      {/* Mobile watermark — more visible on small screens */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden md:hidden"
        style={{
          ...sharedStyle,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(mobileTile)}")`,
          backgroundSize: "180px 180px",
        }}
      />
      {/* Desktop watermark — subtle deterrent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 hidden overflow-hidden md:block"
        style={{
          ...sharedStyle,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(desktopTile)}")`,
        }}
      />
    </>
  );
}
