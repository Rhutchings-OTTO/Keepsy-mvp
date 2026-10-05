import Link from "next/link";
import { redirect } from "next/navigation";
import { ACCOUNT_PATHS } from "@/lib/supabase/config";
import { getOwnerSession } from "@/lib/admin/ownerAuth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Keepsy Studio",
  robots: { index: false, follow: false },
  manifest: "/site.webmanifest",
  appleWebApp: { capable: true, title: "Keepsy Studio" },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getOwnerSession()))
    redirect(ACCOUNT_PATHS.signIn + "?next=/admin");
  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-10 sm:px-10">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <Link className="font-serif text-3xl" href="/admin">
          Keepsy Studio
        </Link>
        <nav className="flex flex-wrap gap-5 text-sm">
          {[
            ["Orders", "orders"],
            ["Contacts", "crm"],
            ["Emails", "campaigns"],
            ["Settings", "settings"],
          ].map(([label, p]) => (
            <Link
              key={p}
              className="rounded-full px-3 py-2 hover:bg-white"
              href={"/admin/" + p}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
