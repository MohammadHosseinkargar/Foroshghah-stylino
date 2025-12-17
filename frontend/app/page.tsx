"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryStrip } from "../components/CategoryStrip";
import { TrustBar } from "../components/TrustBar";
import { ProductSection, DisplayProduct } from "../components/ProductSection";
import { Testimonials } from "../components/Testimonials";
import { WhyStylino } from "../components/WhyStylino";
import { QuickViewModal } from "../components/QuickViewModal";
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
  const { addItem, items, total, removeItem } = useCart();
<<<<<<< HEAD
=======
  const { addItem, items, removeItem, decrementItem, clearCart, getTotalPrice, getTotalCount, isEmpty } = useCart();
>>>>>>> d883c84319dca23021cea7359aa879ecb5535de4
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
      {
        id: 1,
        name: "پیراهن حریر گلدار",
        price: 1890000,
        oldPrice: 2100000,
        image: "",
        tag: "%ویژه",
      },
      {
        id: 2,
        name: "ست لینن تابستانه",
        price: 2250000,
        image: "",
        tag: "%جدید",
      },
      {
        id: 3,
        name: "مانتو لنین تابستانی",
        price: 1990000,
        oldPrice: 2150000,
        image: "",
        tag: "%حراج",
      },
    ];

    if (!products || products.length === 0) {
      return fallback;
    }
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.discountPrice ?? p.basePrice,
      oldPrice: p.discountPrice ? p.basePrice : null,
      image: p.images?.[0],
      tag: p.discountPrice ? "%ویژه" : undefined,
    })) as DisplayProduct[];
  }, [products]);

  const sections = {
    newArrivals: displayProducts.slice(0, 6),
    bestSellers: displayProducts.slice(0, 6).reverse(),
    special: displayProducts.slice(0, 4),
  };

  const handleAddToCart = (product: DisplayProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const goToCheckout = () => {
    setError(null);
    if (items.length === 0) {
      setError("سبد خرید خالی است.");
<<<<<<< HEAD
      return;
    }
    if (!token) {
      router.push("/auth?redirect=/checkout");
      return;
=======
      return;
    }
    if (!token) {
      router.push("/auth?redirect=/checkout");
      return;
    setOrderMessage(null);
    if (!token) {
      router.push("/auth");
      return;
    }
    if (user && user.role !== "CUSTOMER") {
      setError("ثبت سفارش فقط توسط مشتری انجام می‌شود.");
      return;
    }
    if (isEmpty || getTotalCount() === 0) {
      setError("Your cart is empty.");
      return;
    }
    try {
      const order = await apiRequest<{ id: number }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
        },
        token
      );
      await apiRequest(`/orders/${order.id}/pay`, { method: "POST" }, token);
      setOrderMessage("Your order was placed and paid successfully.");
      clearCart();
    } catch (e: any) {
      setError(e.message || "Failed to place order.");
>>>>>>> d883c84319dca23021cea7359aa879ecb5535de4
    }
    router.push("/checkout");
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 lg:px-6 lg:py-12">
        <HeroBanner
          title="حراج تابستانه تا ۳۰٪ تخفیف"
          subtitle="منتخب‌ترین استایل‌های تابستانی با ارسال سریع و ضمانت اصالت کالا"
          ctaLabel="مشاهده محصولات"
        />

        <div className="space-y-6">
          <CategoryStrip
            categories={[
              { name: "مانتو", slug: "manteau" },
              { name: "شومیز", slug: "blouse" },
              { name: "لباس مجلسی", slug: "evening" },
              { name: "ست راحتی", slug: "lounge" },
              { name: "شلوار", slug: "pants" },
              { name: "حراج ویژه", slug: "sale" },
            ]}
          />

          <TrustBar
            items={[
              { title: "ارسال سریع", desc: "تحویل در کوتاه‌ترین زمان", icon: "🚚" },
              { title: "ضمانت بازگشت ۷ روزه", desc: "در صورت عدم رضایت", icon: "↩️" },
              { title: "پرداخت امن اینترنتی", desc: "درگاه امن بانکی", icon: "💳" },
              { title: "پشتیبانی واتساپ", desc: "همیشه در دسترس", icon: "💬" },
            ]}
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-slate-300">در حال بارگذاری محصولات...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="space-y-10">
            <ProductSection
              title="جدیدترین محصولات استایلینو"
              subtitle="استایل‌های منتخب برای امروز"
              products={sections.newArrivals}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
            <ProductSection
              title="پرفروش‌ترین‌ها"
              subtitle="پرفروش‌های هفته"
              products={sections.bestSellers}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
            <ProductSection
              title="پیشنهاد ویژه امروز"
              subtitle="تخفیف‌های محدود"
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
              <h3 className="text-xl font-bold text-brand-900 dark:text-white">سبد شما</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">سفارش واقعی با API بک‌اند ثبت می‌شود.</p>
            </div>
            <div className="text-lg font-bold text-brand-800 dark:text-brand-200">{totalPrice.toLocaleString()} تومان</div>
          </div>

        ) : (
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center justify-between rounded-xl border border-brand-50 px-3 py-3">
                <div>
                  <p className="font-semibold text-brand-900">{i.name}</p>
                  <p className="text-xs text-gray-600">
                    {i.quantity} عدد × {i.price.toLocaleString()} = {(i.price * i.quantity).toLocaleString()} تومان
                  </p>
                </div>
                <button className="text-sm text-red-500" onClick={() => removeItem(i.productId)}>
                  حذف
                </button>
              </div>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={goToCheckout}
                className="rounded-full bg-brand-600 px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                ادامه خرید و پرداخت
<<<<<<< HEAD
=======
          {isEmpty ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-slate-400">سبد خالی است.</p>
              <button className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500">
                مشاهده محصولات محبوب
>>>>>>> d883c84319dca23021cea7359aa879ecb5535de4
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
                      {i.quantity} عدد × {i.price.toLocaleString()} = {(i.price * i.quantity).toLocaleString()} تومان
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full border border-brand-200 px-2 py-1 text-sm text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={() => decrementItem(i.productId)}
                    >
                      -
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold text-brand-900 dark:text-white">
                      {i.quantity}
                    </span>
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
              {orderMessage && <p className="text-sm text-emerald-700 dark:text-emerald-300">{orderMessage}</p>}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={placeOrder}
                  className="w-full rounded-full bg-brand-600 px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500 sm:w-auto"
                >
                  ثبت سفارش و پرداخت
                </button>
                {user && (
                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full rounded-full border border-brand-200 px-5 py-3 text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                  >
                    مشاهده سفارش‌های من
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <Testimonials
          items={[
            { name: "ریحانه قاسمی", city: "تهران", text: "کیفیت پارچه‌ها عالی بود و ارسال هم سریع انجام شد.", rating: 5 },
            { name: "مهسا باقری", city: "اصفهان", text: "پشتیبانی واتساپ خیلی سریع جواب داد و سایز مناسب را راهنمایی کرد.", rating: 5 },
            { name: "سوگند خسروی", city: "شیراز", text: "بسته‌بندی شیک بود و حس لوکس بودن خرید را داشت.", rating: 4 },
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
                  description: "توضیحات مختصر محصول برای پیش‌نمایش سریع",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
