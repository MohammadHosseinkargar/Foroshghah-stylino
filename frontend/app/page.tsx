"use client";
/* eslint-disable react/no-unescaped-entities */

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryStrip } from "../components/CategoryStrip";
import { HeroBanner } from "../components/HeroBanner";
import { ProductSection, DisplayProduct } from "../components/ProductSection";
import { QuickViewModal } from "../components/QuickViewModal";
import { Testimonials } from "../components/Testimonials";
import { TrustBar } from "../components/TrustBar";
import { WhyStylino } from "../components/WhyStylino";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { apiRequest } from "../lib/api";

type Product = {
  id: number;
  sellerId: number;
  name: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  categoryId: number;
  categoryName?: string | null;
  brand: string;
  colors: string[];
  sizes: string[];
  images: string[];
  isActive: boolean;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<DisplayProduct | null>(null);
  const { addItem, items, removeItem, decrementItem, clearCart, getTotalPrice, getTotalCount, isEmpty } = useCart();
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    apiRequest<Product[]>("/products")
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const displayProducts: DisplayProduct[] = useMemo(() => {
    const fallback: DisplayProduct[] = [
      { id: 1, name: "مانتو تابستانی شیک", price: 1890000, oldPrice: 2100000, image: "", tag: "%تخفیف" },
      { id: 2, name: "بلوز مجلسی زنانه", price: 2250000, image: "", tag: "%ویژه" },
      { id: 3, name: "ست مانتو و شلوار", price: 1990000, oldPrice: 2150000, image: "", tag: "%پرفروش" },
    ];

    if (!products || products.length === 0) return fallback;

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.discountPrice ?? p.basePrice,
      oldPrice: p.discountPrice ? p.basePrice : null,
      image: p.images?.[0],
      tag: p.discountPrice ? "%تخفیف" : undefined,
    })) as DisplayProduct[];
  }, [products]);

  const sections = {
    newArrivals: displayProducts.slice(0, 6),
    bestSellers: displayProducts.slice(0, 6).reverse(),
    special: displayProducts.slice(0, 4),
  };

  const handleAddToCart = (product: DisplayProduct) => {
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image });
  };

  const goToCheckout = () => {
    setError(null);
    if (isEmpty || getTotalCount() === 0) {
      setError("سبد خرید خالی است.");
      return;
    }
    if (!token) {
      router.push("/auth?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 lg:px-6 lg:py-12">
        <HeroBanner
          title="حراج تابستانه تا ۳۰٪ تخفیف"
          subtitle="جدیدترین استایل‌های زنانه با تخفیف‌های ویژه، ارسال سریع و پرداخت امن."
          ctaLabel="مشاهده محصولات"
        />

        <div className="space-y-6">
          <CategoryStrip
            categories={[
              { name: "مانتو", slug: "manteau" },
              { name: "بلوز", slug: "blouse" },
              { name: "لباس مجلسی", slug: "evening" },
              { name: "لباس راحتی", slug: "lounge" },
              { name: "شلوار", slug: "pants" },
              { name: "حراج", slug: "sale" },
            ]}
          />

          <TrustBar
            items={[
              { title: "ارسال سریع", desc: "ارسال سریع و پیگیری سفارش", icon: "🚚" },
              { title: "پرداخت امن", desc: "درگاه پرداخت امن و معتبر", icon: "🔒" },
              { title: "پشتیبانی", desc: "پشتیبانی آنلاین و پاسخ‌گویی سریع", icon: "💬" },
              { title: "ضمانت بازگشت", desc: "۷ روز ضمانت بازگشت کالا", icon: "↩️" },
            ]}
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-slate-300">در حال دریافت محصولات...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="space-y-10">
            <ProductSection
              title="جدیدترین محصولات"
              subtitle="به‌روزترین انتخاب‌ها برای استایل شما"
              products={sections.newArrivals}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
            <ProductSection
              title="پرفروش‌ترین‌ها"
              subtitle="محبوب‌ترین‌های این هفته"
              products={sections.bestSellers}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
            <ProductSection
              title="پیشنهاد ویژه"
              subtitle="منتخب‌های تخفیف‌دار"
              products={sections.special}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
          </div>
        )}

        <section className="glass-card border border-brand-50 p-5 shadow-lg ring-1 ring-white/10 dark:border-slate-800 dark:ring-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="badge">سبد خرید</p>
              <h3 className="text-xl font-bold text-brand-900 dark:text-white">سبد خرید شما</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">برای تکمیل خرید به صفحه پرداخت بروید.</p>
            </div>
            <div className="text-lg font-bold text-brand-800 dark:text-brand-200">{totalPrice.toLocaleString("fa-IR")} تومان</div>
          </div>

          {isEmpty ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-slate-400">سبد خرید خالی است.</p>
              <button
                onClick={() => router.push("/products")}
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500"
              >
                مشاهده محصولات
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((i) => (
                <div
                  key={i.productId}
                  className="flex items-center justify-between rounded-xl border border-brand-50 bg-white/60 px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div>
                    <p className="font-semibold text-brand-900 dark:text-white">{i.name}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      {i.quantity} عدد - {i.price.toLocaleString("fa-IR")} = {(i.price * i.quantity).toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full border border-brand-200 px-2 py-1 text-sm text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={() => decrementItem(i.productId)}
                    >
                      -
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold text-brand-900 dark:text-white">{i.quantity}</span>
                    <button
                      className="rounded-full border border-brand-200 px-2 py-1 text-sm text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={() => addItem({ productId: i.productId, name: i.name, price: i.price, image: i.image })}
                    >
                      +
                    </button>
                    <button
                      className="text-sm text-red-500 transition hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                      onClick={() => removeItem(i.productId)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={goToCheckout}
                  className="w-full rounded-full bg-brand-600 px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500 sm:w-auto"
                >
                  ادامه خرید و پرداخت
                </button>
                {user && (
                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full rounded-full border border-brand-200 px-5 py-3 text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                  >
                    مشاهده سفارش‌ها
                  </button>
                )}
                <button
                  onClick={clearCart}
                  className="w-full rounded-full border border-brand-200 px-5 py-3 text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                >
                  خالی کردن سبد
                </button>
              </div>
            </div>
          )}
        </section>

        <Testimonials
          items={[
            { name: "نگار محمدی", city: "تهران", text: "کیفیت عالی و ارسال سریع بود. خیلی راضی‌ام.", rating: 5 },
            { name: "سارا احمدی", city: "اصفهان", text: "پشتیبانی سریع و بسته‌بندی شیک. پیشنهاد می‌کنم.", rating: 5 },
            { name: "مریم رضایی", city: "مشهد", text: "تنوع محصولات خوبه و قیمت‌ها مناسب بود.", rating: 4 },
          ]}
        />

        <WhyStylino />

        <QuickViewModal
          open={!!quickView}
          onClose={() => setQuickView(null)}
          product={
            quickView
              ? {
                  name: quickView.name,
                  price: quickView.price,
                  oldPrice: quickView.oldPrice,
                  image: quickView.image,
                  description: "جزئیات محصول در این بخش نمایش داده می‌شود.",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}

