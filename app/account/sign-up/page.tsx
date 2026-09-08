import { redirect } from "next/navigation";
import { AccountShell, AccountNotConfigured } from "@/components/account/AccountShell";
import { SignUpForm } from "@/components/account/AuthForms";
import { ACCOUNT_PATHS, isSupabaseAuthConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default async function SignUpPage() {
  if (!isSupabaseAuthConfigured()) return <AccountNotConfigured />;
  const user = await getSessionUser();
  if (user) redirect(ACCOUNT_PATHS.home);

  return (
    <AccountShell
      eyebrow="Account"
      title="Create an account"
      narrow
      intro="Optional — you can always check out as a guest. An account keeps your designs and orders together for reordering."
    >
      <SignUpForm />
    </AccountShell>
  );
}
