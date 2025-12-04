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
    <div className="space-y-10">
      <div className="glass-card border border-brand-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="badge">پنل فروشنده</p>
            <h1 className="text-2xl font-bold text-brand-900">{user?.name}</h1>
            <p className="text-sm text-gray-600">مدیریت محصولات، سفارش‌ها و کارمزدها از یک جا</p>
          </div>
          {statusMessage && <span className="text-sm text-emerald-700">{statusMessage}</span>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card border border-brand-50 p-4">
          <p className="text-sm text-gray-600">سفارش‌های این ماه</p>
          <p className="text-3xl font-extrabold text-brand-900">{stats?.monthlyOrders ?? 0}</p>
        </div>
        <div className="glass-card border border-brand-50 p-4">
          <p className="text-sm text-gray-600">کل سفارش‌ها</p>
          <p className="text-3xl font-extrabold text-brand-900">{stats?.totalOrders ?? 0}</p>
        </div>
        <div className="glass-card border border-brand-50 p-4">
          <p className="text-sm text-gray-600">مجموع درآمد</p>
          <p className="text-3xl font-extrabold text-brand-900">{(stats?.revenue ?? 0).toLocaleString()} تومان</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card border border-brand-50 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-900">محصولات</h2>
          </div>
          {dataLoading && <p className="text-sm text-gray-600">در حال بارگذاری محصولات...</p>}
          <div className="mt-4 overflow-hidden rounded-2xl border border-brand-50 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="bg-brand-50/70 text-xs font-semibold text-brand-800">
                <tr>
                  <th className="px-4 py-3">نام محصول</th>
                  <th className="px-4 py-3">قیمت (ویرایش)</th>
                  <th className="px-4 py-3">دسته‌بندی</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3">اقدامات</th>
                  <th className="px-4 py-3">قیمت جاری</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-600" colSpan={6}>
                      محصولی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-brand-50/40">
                      <td className="px-4 py-3 font-semibold text-brand-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <input
                          type="number"
                          className="w-28 rounded-lg border border-brand-100 px-2 py-1 text-sm"
                          value={priceEdits[p.id] ?? ""}
                          onChange={(e) => setPriceEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.categoryName || "-"}</td>
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={!!activeEdits[p.id]}
                            onChange={(e) => setActiveEdits((prev) => ({ ...prev, [p.id]: e.target.checked }))}
                          />
                          <span className="badge">{activeEdits[p.id] ? "فعال" : "غیرفعال"}</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 space-x-2 space-x-reverse">
                        <button
                          className="rounded-full bg-brand-600 px-3 py-1 text-xs text-white hover:bg-brand-700 disabled:opacity-60"
                          onClick={() => handleInlineUpdate(p.id)}
                          disabled={rowSaving[p.id]}
                        >
                          {rowSaving[p.id] ? "..." : "ذخیره"}
                        </button>
                        <button className="text-xs text-red-500" onClick={() => handleDelete(p.id)}>
                          حذف
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
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
        <div className="glass-card border border-brand-50 p-4">
          <h3 className="mb-3 text-lg font-semibold text-brand-900">ایجاد محصول جدید</h3>
          <form className="space-y-3 text-sm" onSubmit={handleCreateProduct}>
            <input
              required
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
              placeholder="نام محصول"
            />
            <textarea
              required
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
              placeholder="توضیحات"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                required
                type="number"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                className="w-full rounded-xl border border-brand-100 px-3 py-2"
                placeholder="قیمت"
              />
              <input
                type="number"
                value={newProduct.discountPrice}
                onChange={(e) => setNewProduct({ ...newProduct, discountPrice: e.target.value })}
                className="w-full rounded-xl border border-brand-100 px-3 py-2"
                placeholder="قیمت تخفیف (اختیاری)"
              />
            </div>
            <select
              required
              value={newProduct.categoryId}
              onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
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
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
              placeholder="برند"
            />
            <div className="grid gap-2 rounded-xl border border-brand-100 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newProduct.colorInput}
                  onChange={(e) => setNewProduct({ ...newProduct, colorInput: e.target.value })}
                  className="flex-1 rounded-lg border border-brand-100 px-3 py-2"
                  placeholder="رنگ (مثال: قرمز)"
                />
                <button
                  type="button"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-white"
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
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-800"
                    >
                      {c}
                      <button
                        type="button"
                        className="text-red-500"
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

            <div className="grid gap-2 rounded-xl border border-brand-100 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newProduct.sizeInput}
                  onChange={(e) => setNewProduct({ ...newProduct, sizeInput: e.target.value })}
                  className="flex-1 rounded-lg border border-brand-100 px-3 py-2"
                  placeholder="سایز (مثال: M)"
                />
                <button
                  type="button"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-white"
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
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-800"
                    >
                      {s}
                      <button
                        type="button"
                        className="text-red-500"
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

            <div className="grid gap-2 rounded-xl border border-brand-100 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newProduct.imageUrlInput}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrlInput: e.target.value })}
                  className="flex-1 rounded-lg border border-brand-100 px-3 py-2"
                  placeholder="لینک تصویر (https://...)"
                />
                <button
                  type="button"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-white"
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
                  className="flex-1 text-xs"
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
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-800"
                    >
                      {img.startsWith("data:") ? "آپلود محلی" : img}
                      <button
                        type="button"
                        className="text-red-500"
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
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-white transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60"
            >
              {creating ? "در حال ثبت..." : "ثبت محصول"}
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card border border-brand-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">سفارش‌های اخیر محصولات شما</h2>
            <span className="badge">به‌روز</span>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-600">سفارشی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-brand-50 bg-white p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>سفارش #{order.id}</span>
                    <span className="badge">{order.paymentStatus}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-700">
                    {order.items.map((it) => (
                      <div key={it.productId} className="flex justify-between">
                        <span>
                          {it.productName} × {it.quantity}
                        </span>
                        <span>{it.totalPrice.toLocaleString()} تومان</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass-card border border-brand-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">کمیسیون‌های دریافتی</h2>
            <span className="badge">به‌روز</span>
          </div>
          {commissions.length === 0 ? (
            <p className="text-sm text-gray-600">کمیسیونی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-brand-50/60 px-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-brand-900">سفارش #{c.orderId}</p>
                    <p className="text-xs text-brand-700">سطح {c.level}</p>
                  </div>
                  <span className="text-brand-800">{c.amount.toLocaleString()} تومان</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
