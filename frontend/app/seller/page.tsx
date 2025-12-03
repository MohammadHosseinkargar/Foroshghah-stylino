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

type ParsedVariants =
  | { sizes: string[]; colors: string[]; images: string[] }
  | { error: string };

function parseVariantCsv(csv: string): ParsedVariants {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { error: "لطفاً CSV سایز/رنگ/تصویر را وارد کنید (هر خط: size,color,imageUrl)" };
  }
  const sizes: string[] = [];
  const colors: string[] = [];
  const images: string[] = [];
  for (const line of lines) {
    const [size, color, image] = line.split(",").map((p) => p.trim());
    if (!size || !color) {
      return { error: "فرمت CSV نامعتبر است. هر خط باید حداقل شامل size,color باشد." };
    }
    sizes.push(size);
    colors.push(color);
    if (image) images.push(image);
  }
  const uniq = (arr: string[]) => Array.from(new Set(arr));
  return { sizes: uniq(sizes), colors: uniq(colors), images: uniq(images) };
}

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
    variantsCsv: "",
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
      const parsed = parseVariantCsv(newProduct.variantsCsv);
      if ("error" in parsed) {
        setError(parsed.error);
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
            discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : null,
            categoryId: Number(newProduct.categoryId),
            brand: newProduct.brand,
            colors: parsed.colors,
            sizes: parsed.sizes,
            images: parsed.images,
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
        variantsCsv: "",
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
            <table className="w-full text-right text-sm">
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
            <div className="grid grid-cols-2 gap-2">
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
            <textarea
              required
              value={newProduct.variantsCsv}
              onChange={(e) => setNewProduct({ ...newProduct, variantsCsv: e.target.value })}
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
              placeholder="CSV سایز/رنگ/تصویر: هر خط size,color,imageUrl (مثال: M,قرمز,https://...)"
            />
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
