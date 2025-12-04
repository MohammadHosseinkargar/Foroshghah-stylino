"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Heart,
  LayoutGrid,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { FormEvent, type ComponentType, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { cn } from "../lib/utils";

type NavLink = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const links: NavLink[] = [
  { href: "/products", label: "محصولات", icon: LayoutGrid },
  { href: "/search", label: "جستجو", icon: Sparkles },
  { href: "/seller", label: "پنل فروشنده", icon: Store },
  { href: "/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/admin", label: "مدیریت", icon: ShieldCheck },
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

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (link.href === "/admin") return user?.role === "ADMIN";
      if (link.href === "/seller") return !user || user.role === "SELLER";
      return true;
    });
  }, [user]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-shadow",
        scrolled ? "shadow-[0_10px_40px_rgba(212,63,120,0.12)]" : "shadow-sm"
      )}
    >
      <div className="h-1 w-full bg-gradient-to-l from-brand-600 via-brand-500 to-brand-400" />
      <div className="border-b border-brand-50/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4">
          <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-3 text-brand-800 transition hover:opacity-90">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-base font-black text-brand-800 shadow-inner sm:h-11 sm:w-11 sm:text-lg">
                  S
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-black md:text-base">استایلینو</p>
                  <p className="text-[10px] font-semibold text-brand-600 md:text-xs">بازار آنلاین مد زنانه</p>
                </div>
              </Link>

              <div className="flex items-center gap-2 sm:hidden">
                <button
                  className="rounded-full border border-brand-100 bg-white p-2 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
                  title="اعلان‌ها"
                  type="button"
                >
                  <Bell className="h-5 w-5" />
                </button>
                <button
                  className="rounded-full border border-brand-100 bg-white p-2 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
                  title="پیشنهاد ویژه"
                  type="button"
                >
                  <Sparkles className="h-5 w-5" />
                </button>
                <Link
                  href="/orders"
                  className="relative rounded-full border border-brand-100 bg-white p-2 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
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
                  className="rounded-full border border-brand-100 bg-white p-2 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
                  title="حساب کاربری"
                >
                  <UserRound className="h-5 w-5 text-brand-700" />
                </Link>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="group flex w-full items-center gap-2 rounded-full border border-brand-100 bg-gray-50 px-3 py-2 text-sm shadow-sm ring-1 ring-transparent transition focus-within:border-brand-200 focus-within:ring-brand-100 md:max-w-xl"
            >
              <Search className="h-5 w-5 text-brand-600 transition group-focus-within:text-brand-700" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی محصول یا برند..."
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-600 px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-700 md:px-4"
              >
                جستجو
              </button>
            </form>

            <div className="hidden items-center gap-2 text-brand-800 sm:flex">
              <button
                className="relative rounded-full border border-brand-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
                title="علاقه‌مندی‌ها"
                type="button"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                className="rounded-full border border-brand-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
                title="اعلان‌ها"
                type="button"
              >
                <Bell className="h-5 w-5" />
              </button>

              <Link
                href="/orders"
                className="relative rounded-full border border-brand-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
                title="سبد خرید / سفارش‌ها"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <button
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="hidden items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70 sm:flex"
                >
                  <UserRound className="h-5 w-5 text-brand-700" />
                  <span>خروج | {user.name}</span>
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="hidden items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 sm:flex"
                >
                  <UserRound className="h-5 w-5 text-brand-700" />
                  <span>حساب کاربری | ورود / ثبت‌نام</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition",
                  isActive(link.href)
                    ? "bg-brand-600 text-white shadow-soft"
                    : "bg-brand-50 text-brand-800 ring-1 ring-brand-100 hover:bg-brand-100"
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden flex-wrap items-center justify-between gap-3 border-t border-brand-100/70 py-3 text-sm font-medium md:flex">
            <nav className="flex flex-wrap items-center gap-1 text-gray-700">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-brand-50 hover:text-brand-800",
                    isActive(link.href) ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100" : ""
                  )}
                >
                  <link.icon className="h-4 w-4 text-brand-600" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:bg-brand-100"
            >
              <MapPin className="h-4 w-4 text-brand-600" />
              <span className="hidden sm:inline">ارسال به تهران | مقصد را انتخاب کنید</span>
              <span className="sm:hidden">تغییر مقصد</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
