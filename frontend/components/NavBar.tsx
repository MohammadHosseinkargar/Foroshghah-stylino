"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { cn } from "../lib/utils";

const links = [
  { href: "/", label: "خانه" },
  { href: "/seller", label: "پنل فروشنده" },
  { href: "/admin", label: "پنل ادمین" },
  { href: "/orders", label: "سفارش‌های من" },
];

export function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { items: cartItems, getTotalCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [searchTerm, setSearchTerm] = useState("");
  const cartCount = useMemo(() => getTotalCount(), [getTotalCount, cartItems]);

  const handleLogout = () => {
    if (authLoading) return;
    logout();
    router.push("/");
  };

  useEffect(() => {
    const current = searchParams?.get("query") ?? "";
    setSearchTerm(current);
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    router.push(`/search?query=${encodeURIComponent(term)}`);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
            <form
              onSubmit={handleSearch}
              className="group flex w-full max-w-xl items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-2 shadow-sm ring-1 ring-transparent transition focus-within:border-brand-300 focus-within:ring-brand-200"
            >
              <Search className="h-4 w-4 text-brand-600 transition group-focus-within:text-brand-700" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در محصولات و دسته‌ها..."
                className="w-full border-none text-sm outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                جستجو
              </button>
            </form>
          </div>
          <div className="flex items-center gap-3 text-brand-800">
            <button
              className="relative rounded-full bg-brand-50 p-2 transition hover:-translate-y-0.5 hover:bg-brand-100"
              title="علاقه‌مندی‌ها"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white">
                  {wishlistCount}
                </span>
              )}
            </button>
            <Link
              href="/orders"
              className="relative rounded-full bg-brand-50 p-2 transition hover:-translate-y-0.5 hover:bg-brand-100"
              title="سبد خرید / سفارش‌ها"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/auth"
              className="rounded-full bg-brand-50 p-2 transition hover:-translate-y-0.5 hover:bg-brand-100"
              title="ورود / ثبت‌نام"
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
                isActive(link.href) ? "bg-brand-50 text-brand-800" : ""
              )}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              disabled={authLoading}
              className="rounded-full bg-brand-600 px-3 py-2 text-white transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
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
