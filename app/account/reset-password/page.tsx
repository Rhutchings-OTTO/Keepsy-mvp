import { AccountShell, AccountNotConfigured } from "@/components/account/AccountShell";
import { ResetPasswordForm } from "@/components/account/AuthForms";
import { isSupabaseAuthConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage() {
  if (!isSupabaseAuthConfigured()) return <AccountNotConfigured />;
  const user = await getSessionUser();
  return (
    <AccountShell eyebrow="Account" title="Choose a new password" narrow>
      <ResetPasswordForm hasSession={Boolean(user)} />
    </AccountShell>
  );
}
