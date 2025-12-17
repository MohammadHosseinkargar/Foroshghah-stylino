"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductSection, type DisplayProduct } from "../../components/ProductSection";
import { QuickViewModal } from "../../components/QuickViewModal";
import { useCart } from "../../context/CartContext";
import { apiRequest } from "../../lib/api";

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

type Category = { id: number; name: string; slug: string };
type SortOption = "newest" | "price-asc" | "price-desc" | "name";

export default function ProductsPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<DisplayProduct | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([apiRequest<Product[]>("/products"), apiRequest<Category[]>("/products/categories")])
      .then(([p, c]) => {
        if (!active) return;
        setProducts(p);
        setCategories(c);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e.message || "خطا در بارگذاری محصولات");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const priceOf = (p: Product) => p.discountPrice ?? p.basePrice;

  const filteredProducts = useMemo(() => {
    const base = selectedCategory === "all" ? products : products.filter((p) => p.categoryId === selectedCategory);
    return [...base].sort((a, b) => {
      if (sort === "price-asc") return priceOf(a) - priceOf(b);
      if (sort === "price-desc") return priceOf(b) - priceOf(a);
      if (sort === "name") return a.name.localeCompare(b.name, "fa");
      return b.id - a.id;
    });
  }, [products, selectedCategory, sort]);

  const displayProducts: DisplayProduct[] = useMemo(
    () =>
      filteredProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: priceOf(p),
        oldPrice: p.discountPrice ? p.basePrice : null,
        image: p.images?.[0],
        tag: p.discountPrice ? "% تخفیف" : undefined,
      })),
    [filteredProducts]
  );

  const sortLabels: Record<SortOption, string> = {
    newest: "جدیدترین",
    "price-asc": "ارزان‌ترین",
    "price-desc": "گران‌ترین",
    name: "حروف الفبا",
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border border-brand-50 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="badge">محصولات</p>
            <h1 className="text-xl font-bold text-brand-900 sm:text-2xl">تمام محصولات استایلینو</h1>
            <p className="text-sm text-gray-600">
              همه محصولات در یک‌جا، با امکان انتخاب دسته‌بندی و مرتب‌سازی بر اساس اولویت شما.
            </p>
            <p className="text-xs text-brand-700">
              {loading
                ? "در حال بارگذاری لیست محصولات..."
                : `${displayProducts.length} محصول${selectedCategory !== "all" ? " در این دسته" : ""}`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === "all"
                    ? "bg-brand-600 text-white shadow-soft"
                    : "bg-brand-50 text-brand-800 hover:-translate-y-0.5 hover:bg-brand-100"
                }`}
              >
                همه دسته‌ها
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === cat.id
                      ? "bg-brand-600 text-white shadow-soft"
                      : "bg-brand-50 text-brand-800 hover:-translate-y-0.5 hover:bg-brand-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span>مرتب‌سازی:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-brand-200 focus:border-brand-300 focus:outline-none"
              >
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && loading && <p className="text-sm text-gray-600">در حال دریافت محصولات...</p>}

      {!loading && !error && displayProducts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-100 bg-white p-6 text-center text-sm text-gray-600">
          محصولی برای نمایش وجود ندارد.
        </div>
      )}

      {!loading && !error && displayProducts.length > 0 && (
        <ProductSection
          title="همه محصولات"
          subtitle="فیلتر دسته‌بندی و مرتب‌سازی فعال است"
          products={displayProducts}
          onAdd={(p) =>
            addItem({
              productId: p.id,
              name: p.name,
              price: p.price,
              image: p.image,
            })
          }
          onQuickView={setQuickView}
        />
      )}

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
                description: "پیش‌نمایش سریع محصول انتخاب‌شده.",
              }
            : undefined
        }
      />
    </div>
  );
}
