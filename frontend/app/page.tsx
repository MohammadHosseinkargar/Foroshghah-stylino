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
      {
        id: 1,
        name: "U_UOOñOUØU+ O-OñUOOñ U_U,O_OOñ",
        price: 1890000,
        oldPrice: 2100000,
        image: "",
        tag: "%U^UOU~UØ",
      },
      {
        id: 2,
        name: "O3O¦ U,UOU+U+ O¦OO'O3O¦OU+UØ",
        price: 2250000,
        image: "",
        tag: "%OªO_UOO_",
      },
      {
        id: 3,
        name: "U.OU+O¦U^ U,U+UOU+ O¦OO'O3O¦OU+UO",
        price: 1990000,
        oldPrice: 2150000,
        image: "",
        tag: "%O-OñOOª",
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
      tag: p.discountPrice ? "%U^UOU~UØ" : undefined,
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
    if (isEmpty || getTotalCount() === 0) {
      setError("O3O'O_ OrOñUOO_ OrOU,UO OO3O¦.");
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
          title="O-OñOOª O¦OO'O3O¦OU+UØ O¦O U3UøU¦ O¦OrU?UOU?"
          subtitle="U.U+O¦OrO'ƒ?OO¦OñUOU+ OO3O¦OUOU,ƒ?OUØOUO O¦OO'O3O¦OU+UO O'O OOñO3OU, O3OñUOO1 U^ OU.OU+O¦ OOæOU,O¦ UcOU,O"
          ctaLabel="U.O'OUØO_UØ U.O-OæU^U,OO¦"
        />

        <div className="space-y-6">
          <CategoryStrip
            categories={[
              { name: "U.OU+O¦U^", slug: "manteau" },
              { name: "O'U^U.UOOý", slug: "blouse" },
              { name: "U,O'OO3 U.OªU,O3UO", slug: "evening" },
              { name: "O3O¦ OñOO-O¦UO", slug: "lounge" },
              { name: "O'U,U^OOñ", slug: "pants" },
              { name: "O-OñOOª U^UOU~UØ", slug: "sale" },
            ]}
          />

          <TrustBar
            items={[
              { title: "OOñO3OU, O3OñUOO1", desc: "O¦O-U^UOU, O_Oñ UcU^O¦OUØƒ?OO¦OñUOU+ OýU.OU+", icon: "dYss" },
              { title: "OU.OU+O¦ O'OOýU_O'O¦ Uú OñU^OýUØ", desc: "O_Oñ OæU^OñO¦ O1O_U. OñOOUOO¦", icon: "ƒ+c‹,?" },
              { title: "U_OñO_OOrO¦ OU.U+ OUOU+O¦OñU+O¦UO", desc: "O_OñU_OUØ OU.U+ O'OU+UcUO", icon: "dY'3" },
              { title: "U_O'O¦UOO'OU+UO U^OO¦O3OU_", desc: "UØU.UOO'UØ O_Oñ O_O3O¦OñO3", icon: "dY'ª" },
            ]}
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-slate-300">O_Oñ O-OU, O'OOñU_OøOOñUO U.O-OæU^U,OO¦...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="space-y-10">
            <ProductSection
              title="OªO_UOO_O¦OñUOU+ U.O-OæU^U,OO¦ OO3O¦OUOU,UOU+U^"
              subtitle="OO3O¦OUOU,ƒ?OUØOUO U.U+O¦OrO' O'OñOUO OU.OñU^Oý"
              products={sections.newArrivals}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
            <ProductSection
              title="U_OñU?OñU^O'ƒ?OO¦OñUOU+ƒ?OUØO"
              subtitle="U_OñU?OñU^O'ƒ?OUØOUO UØU?O¦UØ"
              products={sections.bestSellers}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
            <ProductSection
              title="U_UOO'U+UØOO_ U^UOU~UØ OU.OñU^Oý"
              subtitle="O¦OrU?UOU?ƒ?OUØOUO U.O-O_U^O_"
              products={sections.special}
              onAdd={handleAddToCart}
              onQuickView={setQuickView}
            />
          </div>
        )}

        <section className="glass-card border border-brand-50 p-5 shadow-lg ring-1 ring-white/10 dark:border-slate-800 dark:ring-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="badge">O3O'O_ OrOñUOO_</p>
              <h3 className="text-xl font-bold text-brand-900 dark:text-white">O3O'O_ O'U.O</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                O3U?OOñO' U^OU,O1UO O'O API O'Ucƒ?OOU+O_ O®O'O¦ U.UOƒ?OO'U^O_.
              </p>
            </div>
            <div className="text-lg font-bold text-brand-800 dark:text-brand-200">{totalPrice.toLocaleString()} O¦U^U.OU+</div>
          </div>

          {isEmpty ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-slate-400">O3O'O_ OrOU,UO OO3O¦.</p>
              <button
                onClick={() => router.push("/products")}
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500"
              >
                U.O'OUØO_UØ U.O-OæU^U,OO¦ U.O-O'U^O'
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
                      {i.quantity} O1O_O_ A- {i.price.toLocaleString()} = {(i.price * i.quantity).toLocaleString()} O¦U^U.OU+
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
                      O-OøU?
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
                  OO_OU.UØ OrOñUOO_ U^ U_OñO_OOrO¦
                </button>
                {user && (
                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full rounded-full border border-brand-200 px-5 py-3 text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                  >
                    U.O'OUØO_UØ O3U?OOñO'ƒ?OUØOUO U.U+
                  </button>
                )}
                <button
                  onClick={clearCart}
                  className="w-full rounded-full border border-brand-200 px-5 py-3 text-brand-800 transition hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                >
                  O.O3O¦O3OU, O3O'O_
                </button>
              </div>
            </div>
          )}
        </section>

        <Testimonials
          items={[
            { name: "OñUOO-OU+UØ U,OO3U.UO", city: "O¦UØOñOU+", text: "UcUOU?UOO¦ U_OOñU+UØƒ?OUØO O1OU,UO O'U^O_ U^ OOñO3OU, UØU. O3OñUOO1 OU+OªOU. O'O_.", rating: 5 },
            { name: "U.UØO3O O'OU,OñUO", city: "OOæU?UØOU+", text: "U_O'O¦UOO'OU+UO U^OO¦O3OU_ OrUOU,UO O3OñUOO1 OªU^OO' O_OO_ U^ O3OUOOý U.U+OO3O' OñO OñOUØU+U.OUOUO UcOñO_.", rating: 5 },
            { name: "O3U^U_U+O_ OrO3OñU^UO", city: "O'UOOñOOý", text: "O'O3O¦UØƒ?OO'U+O_UO O'UOUc O'U^O_ U^ O-O3 U,U^UcO3 O'U^O_U+ OrOñUOO_ OñO O_OO'O¦.", rating: 4 },
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
                  description: "O¦U^OUOO-OO¦ U.OrO¦OæOñ U.O-OæU^U, O'OñOUO U_UOO'ƒ?OU+U.OUOO' O3OñUOO1",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
