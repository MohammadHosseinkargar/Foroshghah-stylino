"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";

type Product = {
  id: number;
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

type SellerOrder = {
  id: number;
  customerId: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: { productId: number; productName: string; quantity: number; totalPrice: number }[];
};

type Commission = {
  id: number;
  orderId: number;
  level: number;
  amount: number;
  status: string;
};

type Stats = { revenue: number; monthlyOrders: number; totalOrders: number };
type Category = { id: number; name: string; slug: string };

export default function SellerDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rowSaving, setRowSaving] = useState<Record<number, boolean>>({});

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    basePrice: "",
    discountPrice: "",
    categoryId: "",
    brand: "Stylino",
    colorInput: "",
    sizeInput: "",
    imageUrlInput: "",
    colors: [] as string[],
    sizes: [] as string[],
    images: [] as string[],
  });

  const [priceEdits, setPriceEdits] = useState<Record<number, string>>({});
  const [activeEdits, setActiveEdits] = useState<Record<number, boolean>>({});

  const syncEditFields = (list: Product[]) => {
    const prices: Record<number, string> = {};
    const actives: Record<number, boolean> = {};
    list.forEach((p) => {
      prices[p.id] = String(p.discountPrice ?? p.basePrice);
      actives[p.id] = p.isActive;
    });
    setPriceEdits(prices);
    setActiveEdits(actives);
  };

  const loadData = async () => {
    if (!token) return;
    setDataLoading(true);
    setError(null);
    try {
      const [p, o, c, s, cats] = await Promise.all([
        apiRequest<Product[]>("/seller/products", undefined, token),
        apiRequest<SellerOrder[]>("/seller/orders", undefined, token),
        apiRequest<Commission[]>("/seller/commissions", undefined, token),
        apiRequest<Stats>("/seller/stats", undefined, token),
        apiRequest<Category[]>("/products/categories"),
      ]);
      setProducts(p);
      syncEditFields(p);
      setOrders(o);
      setCommissions(c);
      setStats(s);
      setCategories(cats);
    } catch (e: any) {
      setError(e.message || "خطا در بارگذاری داشبورد فروشنده");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SELLER" || !token) {
      router.push("/auth?redirect=/seller");
      return;
    }
    loadData();
  }, [loading, token, user, router]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError(null);
    setStatusMessage(null);
    try {
      const basePrice = Number(newProduct.basePrice);
      if (Number.isNaN(basePrice) || basePrice <= 0) {
        setError("قیمت پایه نامعتبر است.");
        return;
      }
      const discountPrice = newProduct.discountPrice ? Number(newProduct.discountPrice) : null;
      if (discountPrice !== null && (Number.isNaN(discountPrice) || discountPrice <= 0)) {
        setError("قیمت تخفیف نامعتبر است.");
        return;
      }
      if (newProduct.colors.length === 0) {
        setError("حداقل یک رنگ وارد کنید.");
        return;
      }
      if (newProduct.sizes.length === 0) {
        setError("حداقل یک سایز وارد کنید.");
        return;
      }
      if (newProduct.images.length === 0) {
        setError("حداقل یک تصویر اضافه کنید.");
        return;
      }
      await apiRequest(
        "/seller/products",
        {
          method: "POST",
          body: JSON.stringify({
            name: newProduct.name,
            description: newProduct.description,
            basePrice,
            discountPrice,
            categoryId: Number(newProduct.categoryId),
            brand: newProduct.brand,
            colors: newProduct.colors,
            sizes: newProduct.sizes,
            images: newProduct.images,
            isActive: true,
          }),
        },
        token
      );
      await loadData();
      setNewProduct({
        name: "",
        description: "",
        basePrice: "",
        discountPrice: "",
        categoryId: "",
        brand: "Stylino",
        colorInput: "",
        sizeInput: "",
        imageUrlInput: "",
        colors: [],
        sizes: [],
        images: [],
      });
      setStatusMessage("محصول با موفقیت ایجاد شد.");
    } catch (e: any) {
      setError(e.message || "خطا در ایجاد محصول");
    } finally {
      setCreating(false);
    }
  };

  const handleInlineUpdate = async (productId: number) => {
    if (!token) return;
    const priceValue = priceEdits[productId];
    const price = Number(priceValue);
    if (Number.isNaN(price) || price <= 0) {
      setError("قیمت نامعتبر است.");
      return;
    }
    setRowSaving((prev) => ({ ...prev, [productId]: true }));
    setError(null);
    setStatusMessage(null);
    try {
      await apiRequest(
        `/seller/products/${productId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            basePrice: price,
            discountPrice: price,
            isActive: activeEdits[productId],
          }),
        },
        token
      );
      await loadData();
      setStatusMessage("محصول به‌روزرسانی شد.");
    } catch (e: any) {
      setError(e.message || "به‌روزرسانی محصول ناموفق بود.");
    } finally {
      setRowSaving((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleDelete = async (productId: number) => {
    if (!token) return;
    if (!window.confirm("این محصول حذف شود؟")) return;
    setStatusMessage(null);
    setError(null);
    try {
      await apiRequest(`/seller/products/${productId}`, { method: "DELETE" }, token);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setStatusMessage("محصول حذف شد.");
    } catch (e: any) {
      setError(e.message || "حذف محصول ناموفق بود.");
    }
  };

  if (loading) {
    return <p className="text-gray-600">در حال بررسی احراز هویت...</p>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 text-gray-800 dark:text-slate-100 sm:space-y-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-l from-brand-600 via-brand-500 to-brand-400 p-5 text-white shadow-lg transition-all duration-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 sm:p-7">
        <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              پنل فروشنده
            </p>
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">{user?.name}</h1>
              <p className="text-sm text-white/80">مدیریت محصولات، سفارش‌ها و کارمزدها از یک جا</p>
            </div>
          </div>
          {statusMessage && (
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur">
              {statusMessage}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/40">
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">سفارش‌های این ماه</p>
          <p className="mt-3 text-3xl font-black text-brand-900 dark:text-white">{stats?.monthlyOrders ?? 0}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">نرخ رشد نسبت به ماه گذشته</p>
        </div>
        <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/40">
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">کل سفارش‌ها</p>
          <p className="mt-3 text-3xl font-black text-brand-900 dark:text-white">{stats?.totalOrders ?? 0}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">تا این لحظه</p>
        </div>
        <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/40">
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">مجموع درآمد</p>
          <p className="mt-3 text-3xl font-black text-brand-900 dark:text-white">{(stats?.revenue ?? 0).toLocaleString()} تومان</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">پرداخت شده</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-brand-50 bg-white/90 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-brand-900 dark:text-white">محصولات</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">ویرایش سریع قیمت، وضعیت و مدیریت لیست محصولات</p>
            </div>
            {dataLoading && <span className="text-xs text-brand-700 dark:text-brand-200">در حال تازه‌سازی...</span>}
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-brand-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-right text-xs sm:text-sm">
                <thead className="sticky top-0 bg-white/95 text-[11px] font-semibold text-brand-800 backdrop-blur dark:bg-slate-900/90 dark:text-slate-100 sm:text-xs">
                  <tr>
                    <th className="px-3 py-3 text-left sm:px-4">نام محصول</th>
                    <th className="px-3 py-3 text-left sm:px-4">قیمت (ویرایش)</th>
                    <th className="px-3 py-3 text-left sm:px-4">دسته‌بندی</th>
                    <th className="px-3 py-3 text-left sm:px-4">وضعیت</th>
                    <th className="px-3 py-3 text-left sm:px-4">اقدامات</th>
                    <th className="px-3 py-3 text-left sm:px-4">قیمت جاری</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {products.length === 0 ? (
                    <tr>
                      <td className="px-4 py-5 text-sm text-gray-600 dark:text-slate-400" colSpan={6}>
                        محصولی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    products.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`transition-all duration-200 hover:bg-brand-50/60 dark:hover:bg-slate-800/80 ${
                          idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-brand-50/30 dark:bg-slate-900/70"
                        }`}
                      >
                        <td className="min-w-[160px] px-3 py-3 text-brand-900 dark:text-white sm:px-4">
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{p.brand}</p>
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-slate-200 sm:px-4">
                          <input
                            type="number"
                            className="w-32 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                            value={priceEdits[p.id] ?? ""}
                            onChange={(e) => setPriceEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          />
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-slate-200 sm:px-4">{p.categoryName || "-"}</td>
                        <td className="px-3 py-3 sm:px-4">
                          <label className="flex items-center gap-2 text-xs font-semibold text-brand-800 dark:text-slate-200">
                            <input
                              type="checkbox"
                              checked={!!activeEdits[p.id]}
                              onChange={(e) => setActiveEdits((prev) => ({ ...prev, [p.id]: e.target.checked }))}
                              className="h-4 w-4 accent-brand-600"
                            />
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] ${
                                activeEdits[p.id]
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                                  : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {activeEdits[p.id] ? "فعال" : "غیرفعال"}
                            </span>
                          </label>
                        </td>
                        <td className="px-3 py-3 space-x-2 space-x-reverse sm:px-4">
                          <button
                            className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => handleInlineUpdate(p.id)}
                            disabled={rowSaving[p.id]}
                          >
                            {rowSaving[p.id] ? "..." : "ذخیره"}
                          </button>
                          <button
                            className="text-xs font-semibold text-red-500 transition hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                            onClick={() => handleDelete(p.id)}
                          >
                            حذف
                          </button>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-brand-900 dark:text-white sm:px-4">
                          {(p.discountPrice ?? p.basePrice).toLocaleString()} تومان
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-50 bg-white/90 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-6">
          <div className="mb-4 space-y-1">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-200">ایجاد محصول جدید</p>
            <h3 className="text-xl font-bold text-brand-900 dark:text-white">فرم سریع محصول</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">اطلاعات را کامل کنید و سریعاً منتشر کنید.</p>
          </div>
          <form className="space-y-4 text-sm sm:space-y-5" onSubmit={handleCreateProduct}>
            <div className="grid gap-3 rounded-2xl border border-brand-50 bg-brand-50/40 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">نام و توضیحات</label>
              <input
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                placeholder="نام محصول"
              />
              <textarea
                required
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                placeholder="توضیحات"
              />
            </div>

            <div className="grid gap-3 rounded-2xl border border-brand-50 bg-brand-50/40 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">قیمت‌گذاری و دسته</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  type="number"
                  value={newProduct.basePrice}
                  onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                  className="w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                  placeholder="قیمت"
                />
                <input
                  type="number"
                  value={newProduct.discountPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, discountPrice: e.target.value })}
                  className="w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                  placeholder="قیمت تخفیف (اختیاری)"
                />
              </div>
              <select
                required
                value={newProduct.categoryId}
                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                className="w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
              >
                <option value="">انتخاب دسته‌بندی</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                placeholder="برند"
              />
            </div>

            <div className="grid gap-3 rounded-2xl border border-brand-50 bg-brand-50/40 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">رنگ‌ها</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={newProduct.colorInput}
                  onChange={(e) => setNewProduct({ ...newProduct, colorInput: e.target.value })}
                  className="flex-1 rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                  placeholder="رنگ (مثال: قرمز)"
                />
                <button
                  type="button"
                  className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500"
                  onClick={() => {
                    if (!newProduct.colorInput.trim()) return;
                    setNewProduct((prev) => ({
                      ...prev,
                      colors: Array.from(new Set([...prev.colors, prev.colorInput.trim()])),
                      colorInput: "",
                    }));
                  }}
                >
                  افزودن رنگ
                </button>
              </div>
              {newProduct.colors.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {newProduct.colors.map((c) => (
                    <span
                      key={c}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-brand-800 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:shadow-black/20"
                    >
                      {c}
                      <button
                        type="button"
                        className="text-red-500 dark:text-red-300"
                        onClick={() =>
                          setNewProduct((prev) => ({ ...prev, colors: prev.colors.filter((x) => x !== c) }))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 rounded-2xl border border-brand-50 bg-brand-50/40 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">سایزها</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={newProduct.sizeInput}
                  onChange={(e) => setNewProduct({ ...newProduct, sizeInput: e.target.value })}
                  className="flex-1 rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                  placeholder="سایز (مثال: M)"
                />
                <button
                  type="button"
                  className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500"
                  onClick={() => {
                    if (!newProduct.sizeInput.trim()) return;
                    setNewProduct((prev) => ({
                      ...prev,
                      sizes: Array.from(new Set([...prev.sizes, prev.sizeInput.trim()])),
                      sizeInput: "",
                    }));
                  }}
                >
                  افزودن سایز
                </button>
              </div>
              {newProduct.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {newProduct.sizes.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-brand-800 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:shadow-black/20"
                    >
                      {s}
                      <button
                        type="button"
                        className="text-red-500 dark:text-red-300"
                        onClick={() =>
                          setNewProduct((prev) => ({ ...prev, sizes: prev.sizes.filter((x) => x !== s) }))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 rounded-2xl border border-brand-50 bg-brand-50/40 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">تصاویر</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={newProduct.imageUrlInput}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrlInput: e.target.value })}
                  className="flex-1 rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-brand-400 dark:focus:ring-brand-400/40"
                  placeholder="لینک تصویر (https://...)"
                />
                <button
                  type="button"
                  className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500"
                  onClick={() => {
                    if (!newProduct.imageUrlInput.trim()) return;
                    setNewProduct((prev) => ({
                      ...prev,
                      images: Array.from(new Set([...prev.images, prev.imageUrlInput.trim()])),
                      imageUrlInput: "",
                    }));
                  }}
                >
                  افزودن لینک
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="file"
                  accept="image/*"
                  className="flex-1 text-xs dark:text-slate-200"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl: string = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.onerror = () => reject(reader.error);
                      reader.readAsDataURL(file);
                    });
                    setNewProduct((prev) => ({
                      ...prev,
                      images: Array.from(new Set([...prev.images, dataUrl])),
                    }));
                    e.target.value = "";
                  }}
                />
              </div>
              {newProduct.images.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {newProduct.images.map((img) => (
                    <span
                      key={img}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-brand-800 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:shadow-black/20"
                    >
                      {img.startsWith("data:") ? "آپلود محلی" : img}
                      <button
                        type="button"
                        className="text-red-500 dark:text-red-300"
                        onClick={() =>
                          setNewProduct((prev) => ({ ...prev, images: prev.images.filter((x) => x !== img) }))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={creating}
              className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "در حال ثبت..." : "ثبت محصول"}
            </button>
          </form>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-50 bg-white/90 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-brand-900 dark:text-white">سفارش‌های اخیر محصولات شما</h2>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-slate-800 dark:text-slate-100">
              به‌روز
            </span>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-slate-400">سفارشی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-brand-50 bg-gradient-to-l from-white to-brand-50/60 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60 dark:shadow-black/30"
                >
                  <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-semibold text-brand-900 dark:text-white">سفارش #{order.id}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-700 dark:text-slate-300 sm:text-sm">
                    {order.items.map((it) => (
                      <div key={it.productId} className="flex flex-wrap justify-between gap-2">
                        <span>
                          {it.productName} × {it.quantity}
                        </span>
                        <span className="font-semibold text-brand-800 dark:text-brand-200">
                          {it.totalPrice.toLocaleString()} تومان
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-brand-50 bg-white/90 p-5 shadow-lg backdrop-blur transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-brand-900 dark:text-white">کمیسیون‌های دریافتی</h2>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-slate-800 dark:text-slate-100">
              به‌روز
            </span>
          </div>
          {commissions.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-slate-400">کمیسیونی ثبت نشده است.</p>
          ) : (
            <div className="grid gap-3">
              {commissions.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 rounded-2xl border border-brand-50 bg-gradient-to-l from-white to-brand-50/50 px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60 dark:shadow-black/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-brand-900 dark:text-white">سفارش #{c.orderId}</p>
                    <p className="text-xs text-brand-700 dark:text-brand-200">سطح {c.level}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-800 dark:text-brand-200">
                    {c.amount.toLocaleString()} تومان
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
