import { redirect } from "next/navigation";
import { AccountShell, AccountNotConfigured } from "@/components/account/AccountShell";
import { SignInForm } from "@/components/account/AuthForms";
import { ACCOUNT_PATHS, isSupabaseAuthConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SignInPage({ searchParams }: Props) {
  if (!isSupabaseAuthConfigured()) return <AccountNotConfigured />;
  const params = (await searchParams) ?? {};
  const next = first(params.next);
  const error = first(params.error) ?? null;

  const user = await getSessionUser();
  if (user) redirect(next && next.startsWith("/") && !next.startsWith("//") && !/[\\\u0000-\u001f]/.test(next) ? next : ACCOUNT_PATHS.home);

  return (
    <AccountShell eyebrow="Account" title="Sign in" narrow intro="Your saved designs and orders, in one place.">
      <SignInForm next={next} initialError={error} />
    </AccountShell>
  );
}
