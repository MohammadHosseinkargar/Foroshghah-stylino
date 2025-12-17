import "./globals.css";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Suspense } from "react";
import Providers from "./providers";
import { NavBar } from "../components/NavBar";
import { ShopFooter } from "../components/ShopFooter";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { cn } from "../lib/utils";

const vazir = Vazirmatn({ subsets: ["arabic"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "فروشگاه استایلینو | مد زنانه",
  description: "استایلینو | فروشگاه لباس زنانه با سیستم ارجاع دو سطحی و پنل فروشندگان",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={cn(vazir.className, "bg-white text-gray-900 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100")}>
        <Providers>
          <Suspense fallback={<div className="h-24" />}>
            <NavBar />
          </Suspense>
          <main className="mx-auto min-h-screen max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-24 sm:pt-8 md:px-6 md:pb-16 md:pt-10">
            {children}
          </main>
          <div className="hidden md:block">
            <ShopFooter />
          </div>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
