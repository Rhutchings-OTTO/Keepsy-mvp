import { AccountShell, AccountNotConfigured } from "@/components/account/AccountShell";
import { ForgotPasswordForm } from "@/components/account/AuthForms";
import { isSupabaseAuthConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  if (!isSupabaseAuthConfigured()) return <AccountNotConfigured />;
  return (
    <AccountShell eyebrow="Account" title="Forgotten your password?" narrow intro="Enter your email and we'll send a link to choose a new one.">
      <ForgotPasswordForm />
    </AccountShell>
  );
}
