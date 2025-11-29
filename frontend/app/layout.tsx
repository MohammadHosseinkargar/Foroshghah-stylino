import "./globals.css";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import Providers from "./providers";
import { NavBar } from "../components/NavBar";
import { ShopFooter } from "../components/ShopFooter";
import { cn } from "../lib/utils";

const vazir = Vazirmatn({ subsets: ["arabic"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "فروشگاه استایلینو | مد زنانه",
  description: "استایلینو | فروشگاه لباس زنانه با سیستم ارجاع دو سطحی و پنل فروشندگان",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={cn(vazir.className, "bg-white antialiased")}>
        <Providers>
          <NavBar />
          <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">{children}</main>
          <ShopFooter />
        </Providers>
      </body>
    </html>
  );
}
