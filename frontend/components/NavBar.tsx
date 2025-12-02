"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { useCart } from "../context/CartContext";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "فروشگاه" },
  { href: "/seller", label: "پنل فروشندگان" },
  { href: "/admin", label: "پنل ادمین" },
  { href: "/orders", label: "سفارش‌های من" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-pink-50/70 bg-white/90 backdrop-blur transition-shadow",
        scrolled ? "shadow-[0_10px_30px_rgba(212,63,120,0.12)]" : ""
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-2 text-xs font-semibold text-brand-800">Stylino</span>
            <span className="text-lg font-bold text-brand-800">استایلینو</span>
          </Link>
          <div className="flex flex-1 items-center justify-center">
            <div className="group flex w-full max-w-xl items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-2 shadow-sm ring-1 ring-transparent transition focus-within:border-brand-300 focus-within:ring-brand-200">
              <Search className="h-4 w-4 text-brand-600 transition group-focus-within:text-brand-700" />
              <input
                placeholder="جستجو در محصولات استایلینو…"
                className="w-full border-none text-sm outline-none placeholder:text-gray-400"
              />
              <button className="rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-700">
                جستجو
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-brand-800">
            <button className="relative rounded-full bg-brand-50 p-2 transition hover:-translate-y-0.5 hover:bg-brand-100" title="علاقه‌مندی‌ها">
              <Heart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-brand-600 text-[10px] font-bold text-white">1</span>
            </button>
            <Link
              href="/checkout"
              className="relative rounded-full bg-brand-50 p-2 transition hover:-translate-y-0.5 hover:bg-brand-100"
              title="سبد خرید / سفارش‌ها"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/auth"
              className="rounded-full bg-brand-50 p-2 transition hover:-translate-y-0.5 hover:bg-brand-100"
              title="حساب کاربری"
            >
              <UserRound className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 transition hover:-translate-y-0.5 hover:bg-brand-50 hover:text-brand-800",
                pathname === link.href ? "bg-brand-50 text-brand-800" : ""
              )}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              className="rounded-full bg-brand-600 px-3 py-2 text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
              onClick={handleLogout}
            >
              خروج ({user.name})
            </button>
          ) : (
            <Link
              href="/auth"
              className="rounded-full bg-brand-600 px-3 py-2 text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
