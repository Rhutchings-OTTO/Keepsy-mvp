"use client";

type Props = {
  aspectRatio?: number;
  className?: string;
};

export function MockupSkeleton({ aspectRatio = 1.7778, className = "" }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-black/5 bg-[#F0EFED] ${className}`}
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      <div className="h-full w-full animate-pulse bg-gradient-to-r from-[#E8E6E4] via-[#F2F0EE] to-[#E8E6E4] bg-[length:200%_100%]" />
    </div>
  );
}
