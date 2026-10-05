"use client";

type InteractiveCardProps = {
  title?: string;
  subtitle?: string;
  image?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  href?: string;
};

/** Simple card with optional link/button wrapper. No hover tilt or scale. */
export function InteractiveCard({
  title,
  subtitle,
  image,
  onClick,
  children,
  className = "",
  href,
}: InteractiveCardProps) {
  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-(--color-charcoal)/8 bg-white p-3 shadow-[0_1px_2px_rgba(45,41,38,0.04),0_12px_28px_-22px_rgba(45,41,38,0.25)] ${className}`}
    >
      {image && <div className="overflow-hidden rounded-xl">{image}</div>}
      {title && (
        <div className="mt-2 font-semibold text-(--color-charcoal)">
          {title}
        </div>
      )}
      {subtitle && (
        <div className="text-sm text-(--color-charcoal)/60">{subtitle}</div>
      )}
      {children}
    </div>
  );

  const focusRing =
    "block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-(--color-terracotta)/40 focus-visible:ring-offset-2";
  if (href) {
    return (
      <a href={href} className={focusRing}>
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${focusRing} w-full text-left`}
      >
        {content}
      </button>
    );
  }
  return content;
}
