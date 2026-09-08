import Link from "next/link";
import type { ReactNode } from "react";

/** Shared framing for every /account screen — keeps the friendly card look consistent. */
export function AccountShell({
  eyebrow,
  title,
  intro,
  children,
  narrow = false,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <main className={`mx-auto ${narrow ? "max-w-lg" : "max-w-6xl"} px-4 py-10 sm:px-6`}>
      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 shadow-[0_16px_40px_-20px_rgba(45,41,38,0.12)] sm:p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--color-terracotta)" }}>
          {eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.04em] sm:text-4xl" style={{ color: "var(--color-charcoal)" }}>
          {title}
        </h1>
        {intro ? (
          <div className="mt-3 text-base leading-7" style={{ color: "rgba(45,41,38,0.65)" }}>
            {intro}
          </div>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export function AccountNotConfigured() {
  return (
    <AccountShell
      eyebrow="Account"
      title="We couldn't open your account"
      narrow
      intro={
        <>
          Please try again shortly. You can also continue creating a gift as a guest.
        </>
      }
    >
      <Link
        href="/create"
        className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: "var(--color-terracotta)" }}
      >
        Create a gift as a guest
      </Link>
    </AccountShell>
  );
}
