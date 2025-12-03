"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Grid, Home, Receipt, Search, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { getTotalCount, items } = useCart();
  const { user } = useAuth();
  const cartCount = useMemo(() => getTotalCount(), [getTotalCount, items]);

  const navItems = [
    { href: "/", label: "OrOU+U�", icon: Home },
    { href: "/search", label: "O�O3O�O�U^", icon: Search },
    { href: "/products", label: "O_O3O�U؃?OO\"U+O_UO", icon: Grid },
    { href: "/orders", label: "O3U?OO�O'OO�", icon: Receipt, badge: cartCount },
    { href: "/auth", label: user ? "OrO�U^O�" : "U_O�U^U?OUOU,", icon: User },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-50 bg-white/95 shadow-[0_-6px_30px_rgba(212,63,120,0.12)] backdrop-blur supports-[backdrop-filter]:bg-white/85 md:hidden">
      <div className="mx-auto flex max-w-5xl items-stretch justify-between gap-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
              isActive(item.href) ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100" : "text-gray-500 hover:text-brand-700"
            )}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5", isActive(item.href) ? "stroke-brand-700" : "stroke-current")} />
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
