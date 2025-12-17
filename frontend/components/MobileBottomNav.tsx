"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid, Home, Receipt, Search, User } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { cn } from "../lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { getTotalCount } = useCart();
  const { user } = useAuth();
  const cartCount = getTotalCount();

  const navItems = [
    { href: "/", label: "\u062E\u0627\u0646\u0647", icon: Home },
    { href: "/search", label: "\u062C\u0633\u062A\u062C\u0648", icon: Search },
    { href: "/products", label: "\u0645\u062D\u0635\u0648\u0644\u0627\u062A", icon: Grid },
    {
      href: "/orders",
      label: "\u0633\u0641\u0627\u0631\u0634\u200C\u0647\u0627",
      icon: Receipt,
      badge: cartCount,
    },
    {
      href: "/auth",
      label: user ? "\u062D\u0633\u0627\u0628" : "\u0648\u0631\u0648\u062F / \u062B\u0628\u062A\u200C\u0646\u0627\u0645",
      icon: User,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-50 bg-white/95 shadow-[0_-6px_30px_rgba(212,63,120,0.12)] backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_-6px_26px_rgba(0,0,0,0.4)] supports-[backdrop-filter]:dark:bg-slate-900/80 md:hidden">
      <div className="mx-auto flex max-w-5xl items-stretch justify-between gap-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
              isActive(item.href)
                ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                : "text-gray-500 hover:text-brand-700 dark:text-slate-300 dark:hover:text-white"
            )}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <item.icon
              className={cn(
                "h-5 w-5",
                isActive(item.href)
                  ? "stroke-brand-700 dark:stroke-white"
                  : "stroke-current dark:stroke-slate-200"
              )}
            />
            {item.badge ? (
              <span className="absolute right-2 top-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white">
                {item.badge}
              </span>
            ) : null}
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
