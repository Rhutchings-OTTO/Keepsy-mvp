"use client";

type Props = {
  aspectRatio?: number;
  className?: string;
};

export function MockupSkeleton({
  aspectRatio = 1.7778,
  className = "",
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-(--color-charcoal)/8 bg-[#F7F2EB] ${className}`}
      style={{ aspectRatio: `${aspectRatio}` }}
      aria-hidden
    >
      <div className="h-full w-full animate-pulse bg-[#F1EBE3] motion-reduce:animate-none" />
    </div>
  );
}
