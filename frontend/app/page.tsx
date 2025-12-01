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
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
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

  const placeOrder = async () => {
    setError(null);
    setOrderMessage(null);
    if (!token) {
      router.push("/auth");
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
    }
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="space-y-12 bg-[radial-gradient(circle_at_10%_20%,#fff7fb,transparent_25%),radial-gradient(circle_at_90%_10%,#fef2f8,transparent_25%)]">
      <HeroBanner
        title="حراج تابستانه تا ۳۰٪ تخفیف"
        subtitle="منتخب‌ترین استایل‌های تابستانی با ارسال سریع و ضمانت اصالت کالا"
        ctaLabel="مشاهده محصولات"
      />

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

      {loading ? (
        <p className="text-gray-600">در حال بارگذاری محصولات...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
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
        </>
      )}

      <section className="glass-card border border-brand-50 p-6 md:sticky md:top-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="badge">سبد خرید</p>
            <h3 className="text-xl font-bold text-brand-900">سبد شما</h3>
            <p className="text-sm text-gray-600">سفارش واقعی با API بک‌اند ثبت می‌شود.</p>
          </div>
          <div className="text-lg font-bold text-brand-800">{totalPrice.toLocaleString()} تومان</div>
        </div>
        {isEmpty ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-600">سبد خالی است.</p>
            <button className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              مشاهده محصولات محبوب
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center justify-between rounded-xl border border-brand-50 px-3 py-3">
                <div>
                  <p className="font-semibold text-brand-900">{i.name}</p>
                  <p className="text-xs text-gray-600">
                    {i.quantity} O1O_O_ A- {i.price.toLocaleString()} = {(i.price * i.quantity).toLocaleString()} O?U^U.OU+
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full border border-brand-200 px-2 py-1 text-sm text-brand-800 hover:bg-brand-50"
                    onClick={() => decrementItem(i.productId)}
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold text-brand-900">{i.quantity}</span>
                  <button
                    className="rounded-full border border-brand-200 px-2 py-1 text-sm text-brand-800 hover:bg-brand-50"
                    onClick={() => addItem({ productId: i.productId, name: i.name, price: i.price, image: i.image })}
                  >
                    +
                  </button>
                  <button className="text-sm text-red-500" onClick={() => removeItem(i.productId)}>
                    O-O?U?
                  </button>
                </div>
              </div>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {orderMessage && <p className="text-sm text-emerald-700">{orderMessage}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={placeOrder}
                className="rounded-full bg-brand-600 px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                ثبت سفارش و پرداخت
              </button>
              {user && (
                <button
                  onClick={() => router.push("/orders")}
                  className="rounded-full border border-brand-200 px-5 py-3 text-brand-800 transition hover:bg-brand-50"
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
  );
}
