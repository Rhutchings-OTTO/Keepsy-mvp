"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showChrome = pathname !== "/";

  return (
    <div className="min-h-screen flex flex-col">
      {showChrome ? <SiteHeader /> : null}
      <main className="flex-1">{children}</main>
      {showChrome ? <SiteFooter /> : null}
    </div>
  );
}
