"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ACCOUNT_PATHS } from "@/lib/supabase/config";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-[16px] text-charcoal outline-none placeholder:text-charcoal/35 focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/15 disabled:opacity-60";
const primaryBtn =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles =
    tone === "error"
      ? { backgroundColor: "rgba(196,113,74,0.10)", color: "var(--color-terra-dark)" }
      : tone === "success"
      ? { backgroundColor: "rgba(44,74,62,0.10)", color: "var(--color-forest)" }
      : { backgroundColor: "#F5EDE0", color: "var(--color-charcoal)" };
  return (
    <p role={tone === "error" ? "alert" : "status"} className="rounded-xl px-4 py-3 text-sm font-semibold" style={styles}>
      {children}
    </p>
  );
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Check both and try again.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link we sent.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password should be")) return "Passwords need at least 8 characters.";
  if (m.includes("already registered") || m.includes("already exists")) return "There's already an account for that email. Try signing in, or reset your password.";
  if (m.includes("network") || m.includes("fetch")) return "We couldn't reach the sign-in service. Check your connection and try again.";
  return message || "Something went wrong. Please try again.";
}

function originUrl(path: string): string {
  return `${window.location.origin}${path}`;
}

/* ─── Sign in ─────────────────────────────────────────────────────────────── */

export function SignInForm({ next, initialError }: { next?: string; initialError?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(initialError ? "error" : "idle");
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus("error");
      setError("Accounts aren't switched on yet.");
      return;
    }
    setStatus("submitting");
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setStatus("error");
      setError(friendlyAuthError(err.message));
      return;
    }
    setStatus("success");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") && !/[\\\u0000-\u001f]/.test(next) ? next : ACCOUNT_PATHS.home);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {status === "success" ? <Notice tone="success">Signed in — taking you to your account…</Notice> : null}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-charcoal/70">Email</span>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} disabled={status === "submitting"} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-charcoal/70">Password</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} disabled={status === "submitting"} />
      </label>
      <button type="submit" disabled={status === "submitting" || !email || !password} className={primaryBtn} style={{ backgroundColor: "var(--color-terracotta)" }}>
        {status === "submitting" ? "Signing in…" : "Sign in"}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-charcoal/60">
        <Link href={ACCOUNT_PATHS.forgotPassword} className="underline underline-offset-2 hover:text-charcoal">Forgotten your password?</Link>
        <span>
          New here?{" "}
          <Link href={ACCOUNT_PATHS.signUp} className="font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
            Create an account
          </Link>
        </span>
      </div>
    </form>
  );
}

/* ─── Sign up ─────────────────────────────────────────────────────────────── */

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus("error");
      setError("Accounts aren't switched on yet.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setError("Passwords need at least 8 characters.");
      return;
    }
    setStatus("submitting");
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: originUrl(`${ACCOUNT_PATHS.callback}?next=${encodeURIComponent(ACCOUNT_PATHS.home)}`) },
    });
    if (err) {
      setStatus("error");
      setError(friendlyAuthError(err.message));
      return;
    }
    // With email confirmation on, an existing email returns a user with no identities
    // (Supabase deliberately hides whether the address is registered). Show the same
    // "check your inbox" message in both cases — it is accurate for the honest path and
    // does not leak account existence.
    void data;
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <Notice tone="success">Check your inbox — we&apos;ve sent a confirmation link to {email.trim()}.</Notice>
        <p className="text-sm leading-6 text-charcoal/60">
          Click the link to activate your account, then sign in. If it doesn&apos;t arrive in a couple of minutes, look in
          your junk folder — it&apos;s us, we promise.
        </p>
        <Link href={ACCOUNT_PATHS.signIn} className="text-sm font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-charcoal/70">Email</span>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} disabled={status === "submitting"} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-charcoal/70">Password</span>
        <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} disabled={status === "submitting"} />
        <span className="mt-1 block text-xs text-charcoal/50">At least 8 characters.</span>
      </label>
      <button type="submit" disabled={status === "submitting" || !email || !password} className={primaryBtn} style={{ backgroundColor: "var(--color-terracotta)" }}>
        {status === "submitting" ? "Creating your account…" : "Create account"}
      </button>
      <p className="text-sm text-charcoal/60">
        Already have one?{" "}
        <Link href={ACCOUNT_PATHS.signIn} className="font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

/* ─── Forgot password ─────────────────────────────────────────────────────── */

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus("error");
      setError("Accounts aren't switched on yet.");
      return;
    }
    setStatus("submitting");
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: originUrl(`${ACCOUNT_PATHS.callback}?next=${encodeURIComponent(ACCOUNT_PATHS.resetPassword)}`),
    });
    if (err) {
      setStatus("error");
      setError(friendlyAuthError(err.message));
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <Notice tone="success">If there&apos;s an account for {email.trim()}, a reset link is on its way.</Notice>
        <p className="text-sm leading-6 text-charcoal/60">Open the link on this device to choose a new password. It expires after an hour.</p>
        <Link href={ACCOUNT_PATHS.signIn} className="text-sm font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-charcoal/70">Email</span>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} disabled={status === "submitting"} />
      </label>
      <button type="submit" disabled={status === "submitting" || !email} className={primaryBtn} style={{ backgroundColor: "var(--color-terracotta)" }}>
        {status === "submitting" ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-sm text-charcoal/60">
        <Link href={ACCOUNT_PATHS.signIn} className="underline underline-offset-2 hover:text-charcoal">Back to sign in</Link>
      </p>
    </form>
  );
}

/* ─── Reset password (after the recovery link) ────────────────────────────── */

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!hasSession) {
    return (
      <div className="space-y-4">
        <Notice tone="info">This page only works from the link in your password-reset email.</Notice>
        <Link href={ACCOUNT_PATHS.forgotPassword} className="text-sm font-semibold underline underline-offset-2" style={{ color: "var(--color-terracotta)" }}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus("error");
      setError("Accounts aren't switched on yet.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setError("Passwords need at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setError("Those passwords don't match.");
      return;
    }
    setStatus("submitting");
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setStatus("error");
      setError(friendlyAuthError(err.message));
      return;
    }
    setStatus("success");
    setTimeout(() => {
      router.replace(ACCOUNT_PATHS.home);
      router.refresh();
    }, 800);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {status === "success" ? <Notice tone="success">Password updated — taking you to your account…</Notice> : null}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-charcoal/70">New password</span>
        <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} disabled={status === "submitting"} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-charcoal/70">Confirm new password</span>
        <input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} disabled={status === "submitting"} />
      </label>
      <button type="submit" disabled={status === "submitting" || !password || !confirm} className={primaryBtn} style={{ backgroundColor: "var(--color-terracotta)" }}>
        {status === "submitting" ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

/* ─── Sign out ────────────────────────────────────────────────────────────── */

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={ACCOUNT_PATHS.signOut} method="post">
      <button
        type="submit"
        className={
          className ??
          "inline-flex h-10 items-center rounded-xl border border-charcoal/15 px-4 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
        }
      >
        Sign out
      </button>
    </form>
  );
}
