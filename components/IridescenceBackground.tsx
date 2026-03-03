"use client";

/**
 * CSS-only iridescent wave background. No WebGL - works everywhere.
 * Multiple animated gradient layers create the flowing oil-slick effect.
 */
export default function IridescenceBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #e9d5ff 0%, #f5d0fe 15%, #ddd6fe 35%, #a5f3fc 55%, #99f6e4 75%, #c4b5fd 90%, #e9d5ff 100%)",
          backgroundSize: "200% 200%",
          animation: "iridescence-shift 12s ease-in-out infinite",
        }}
      />
      <div
        className="iridescence-layer iridescence-layer-1"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 30% 30%, rgba(216, 180, 254, 0.55), rgba(244, 114, 182, 0.4), transparent 70%)",
        }}
      />
      <div
        className="iridescence-layer iridescence-layer-2"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 75% 25%, rgba(94, 234, 212, 0.5), rgba(34, 211, 238, 0.4), transparent 65%)",
        }}
      />
      <div
        className="iridescence-layer iridescence-layer-3"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 50% 60%, rgba(196, 181, 253, 0.45), rgba(167, 139, 250, 0.35), transparent 60%)",
        }}
      />
      <div
        className="iridescence-layer iridescence-layer-4"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 20% 70%, rgba(251, 207, 232, 0.4), rgba(226, 232, 240, 0.5), transparent 70%)",
        }}
      />
      <style>{`
        .iridescence-layer {
          position: absolute;
          inset: -20%;
          animation: iridescence-float 18s ease-in-out infinite;
        }
        .iridescence-layer-2 { animation-delay: -4s; animation-duration: 22s; }
        .iridescence-layer-3 { animation-delay: -8s; animation-duration: 16s; }
        .iridescence-layer-4 { animation-delay: -12s; animation-duration: 20s; }
        @keyframes iridescence-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(5%, -5%) scale(1.05); }
          50% { transform: translate(-5%, 3%) scale(0.98); }
          75% { transform: translate(3%, 5%) scale(1.02); }
        }
        @keyframes iridescence-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
