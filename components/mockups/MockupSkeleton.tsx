"use client";

type Props = {
  aspectRatio?: number;
  className?: string;
};

export function MockupSkeleton({ aspectRatio = 1.7778, className = "" }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-black/5 ${className}`}
      style={{ aspectRatio: `${aspectRatio}`, backgroundColor: "rgba(253,246,238,0.8)" }}
    >
      <div className="h-full w-full animate-pulse bg-gradient-to-r from-[rgba(253,246,238,0.6)] via-[rgba(253,246,238,1)] to-[rgba(253,246,238,0.6)] bg-[length:200%_100%]" />
    </div>
  );
}
