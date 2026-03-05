"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DynamicLogo } from "@/components/DynamicLogo";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Gift, PlusCircle, Star, Mail } from "lucide-react";

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
        className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex h-14 w-14 items-center justify-center rounded-full frosted-glass shadow-lg md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={24} className="text-obsidian" />
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl frosted-glass border-t border-white/30 shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between p-4">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-obsidian"
                >
                  <DynamicLogo
                    href={null}
                    width={80}
                    className="h-6 w-auto brightness-0 invert"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 hover:bg-white/30"
                  aria-label="Close"
                >
                  <X size={20} className="text-obsidian" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 px-4 pb-8">
                {NAV_ITEMS.map(({ href, label, Icon }) => {
                  const isExternal = href.startsWith("mailto:");
                  const active =
                    href === "/" ? pathname === "/" : !isExternal && pathname.startsWith(href.replace("/#reviews", ""));
                  return isExternal ? (
                    <a
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-obsidian hover:bg-white/40"
                    >
                      <Icon size={20} className="text-obsidian/70" />
                      {label}
                    </a>
                  ) : (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold ${
                        active ? "bg-white/50 text-obsidian" : "text-obsidian hover:bg-white/40"
                      }`}
                    >
                      <Icon size={20} className="text-obsidian/70" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
