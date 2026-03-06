"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DynamicLogo } from "@/components/DynamicLogo";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X, Gift, PlusCircle, Star, Mail } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Gift },
  { href: "/gift-ideas", label: "Gift Ideas", Icon: Gift },
  { href: "/create", label: "Create", Icon: PlusCircle },
  { href: "/#reviews", label: "Reviews", Icon: Star },
  { href: "mailto:support@keepsy.store", label: "Support", Icon: Mail },
];

export function BottomSheetNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Trigger — fixed bottom on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-1/2 z-40 flex h-14 min-w-[13rem] -translate-x-1/2 items-center justify-between rounded-full border border-white/70 bg-[rgba(255,255,255,0.84)] px-4 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.42)] backdrop-blur-xl md:hidden"
        aria-label="Open navigation"
      >
        <span className="text-sm font-semibold text-[#221d1a]">Menu</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f2937] text-white">
          <Menu size={18} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t border-white/40 bg-[rgba(248,244,238,0.96)] shadow-[0_-24px_60px_-34px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:hidden"
            >
              <div className="flex items-center justify-between p-5">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-[#201d1b]"
                >
                  <DynamicLogo
                    href={null}
                    width={92}
                    className="h-7 w-auto text-[#201d1b]"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-black/8 bg-white/75 p-2 hover:bg-white"
                  aria-label="Close"
                >
                  <X size={18} className="text-[#201d1b]" />
                </button>
              </div>
              <div className="px-5">
                <div className="rounded-[1.5rem] border border-white/60 bg-white/68 p-3 shadow-[0_16px_34px_-24px_rgba(0,0,0,0.28)]">
                  <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-black/40">
                    Navigate
                  </p>
                  <nav className="flex flex-col gap-1 pb-1">
                {NAV_ITEMS.map(({ href, label, Icon }) => {
                  const isExternal = href.startsWith("mailto:");
                  const active =
                    href === "/" ? pathname === "/" : !isExternal && pathname.startsWith(href.replace("/#reviews", ""));
                  return isExternal ? (
                    <a
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#201d1b] hover:bg-black/[0.04]"
                    >
                      <Icon size={18} className="text-black/55" />
                      {label}
                    </a>
                  ) : (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold ${
                        active ? "bg-[#1f2937] text-white" : "text-[#201d1b] hover:bg-black/[0.04]"
                      }`}
                    >
                      <Icon size={18} className={active ? "text-white/75" : "text-black/55"} />
                      {label}
                    </Link>
                  );
                })}
                  </nav>
                </div>
                <Link
                  href="/create"
                  onClick={() => setOpen(false)}
                  className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1f2937] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(17,24,39,0.5)]"
                >
                  Start creating
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="pb-8" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
