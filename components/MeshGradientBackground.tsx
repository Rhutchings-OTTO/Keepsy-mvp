// Static page background.
//
// Replaces the WebGL mesh shader (@paper-design/shaders-react). The whole site
// sits on the cream brand colour with a single, very soft radial tint at the
// top so large sections don't feel flat. Nothing animates.

type MeshGradientBackgroundProps = {
  className?: string;
};

export function MeshGradientBackground({
  className = "",
}: MeshGradientBackgroundProps) {
  return (
    <div
      aria-hidden
      className={`fixed inset-0 h-full w-full ${className}`}
      style={{
        backgroundColor: "var(--color-cream)",
        backgroundImage:
          "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(196,113,74,0.10) 0%, rgba(196,113,74,0) 70%)",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
