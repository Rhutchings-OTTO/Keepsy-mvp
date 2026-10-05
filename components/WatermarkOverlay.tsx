/**
 * WatermarkOverlay — CSS-only preview watermark.
 *
 * A single diagonal "Keepsy · preview" wordmark repeated on a wide 320px
 * grid, in the site serif at a light weight. It is a pointer-events-none
 * overlay, so buttons and the zoom loupe underneath keep working, and the
 * underlying image files stay clean. Opacity is ~0.10 on desktop and ~0.16
 * on small screens (where screenshots are more common).
 *
 * Use inside any `position: relative; overflow: hidden` container.
 */

const CELL = 320;
// Enough cells to cover a rotated 3× oversize layer for previews up to ~1100px wide.
const CELLS = Array.from({ length: 110 }, (_, i) => i);

export function WatermarkOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] opacity-[0.16] md:opacity-[0.10]"
        style={{
          width: "300%",
          height: "300%",
          gridTemplateColumns: `repeat(auto-fill, ${CELL}px)`,
          gridAutoRows: `${CELL}px`,
          alignContent: "start",
          justifyContent: "start",
        }}
      >
        {CELLS.map((i) => (
          <span
            key={i}
            className="flex items-center justify-center whitespace-nowrap font-serif text-[22px] font-light tracking-[0.08em] text-(--color-charcoal)"
          >
            Keepsy · preview
          </span>
        ))}
      </div>
    </div>
  );
}
