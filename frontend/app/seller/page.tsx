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
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    basePrice: "",
    discountPrice: "",
    categoryId: "",
    brand: "Stylino",
    colors: "",
    sizes: "",
    images: "",
  });

  const [updateProductForm, setUpdateProductForm] = useState({
    productId: "",
    basePrice: "",
    discountPrice: "",
    isActive: "true",
  });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SELLER" || !token) {
      router.push("/auth?redirect=/seller");
      return;
    }
    const load = async () => {
      try {
        const [p, o, c, s, cats] = await Promise.all([
          apiRequest<Product[]>("/seller/products", undefined, token),
          apiRequest<SellerOrder[]>("/seller/orders", undefined, token),
          apiRequest<Commission[]>("/seller/commissions", undefined, token),
          apiRequest<Stats>("/seller/stats", undefined, token),
          apiRequest<Category[]>("/products/categories"),
        ]);
        setProducts(p);
        setOrders(o);
        setCommissions(c);
        setStats(s);
        setCategories(cats);
      } catch (e: any) {
        setError(e.message || "خطا در دریافت داده‌های فروشنده");
      }
    };
    load();
  }, [loading, token, user, router]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError(null);
    try {
      await apiRequest(
        "/seller/products",
        {
          method: "POST",
          body: JSON.stringify({
            name: newProduct.name,
            description: newProduct.description,
            basePrice: Number(newProduct.basePrice),
            discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : null,
            categoryId: Number(newProduct.categoryId),
            brand: newProduct.brand,
            colors: newProduct.colors
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            sizes: newProduct.sizes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            images: newProduct.images
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            isActive: true,
          }),
        },
        token
      );
      const refreshed = await apiRequest<Product[]>("/seller/products", undefined, token);
      setProducts(refreshed);
      setNewProduct({
        name: "",
        description: "",
        basePrice: "",
        discountPrice: "",
        categoryId: "",
        brand: "Stylino",
        colors: "",
        sizes: "",
        images: "",
      });
    } catch (e: any) {
      setError(e.message || "خطا در ساخت محصول");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !updateProductForm.productId) return;
    setUpdating(true);
    setError(null);
    try {
      await apiRequest(
        `/seller/products/${updateProductForm.productId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            basePrice: updateProductForm.basePrice ? Number(updateProductForm.basePrice) : undefined,
            discountPrice: updateProductForm.discountPrice ? Number(updateProductForm.discountPrice) : undefined,
            isActive: updateProductForm.isActive === "true",
          }),
        },
        token
      );
      const refreshed = await apiRequest<Product[]>("/seller/products", undefined, token);
      setProducts(refreshed);
    } catch (e: any) {
      setError(e.message || "خطا در ویرایش محصول");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!token) return;
    try {
      await apiRequest(`/seller/products/${productId}`, { method: "DELETE" }, token);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (e: any) {
      setError(e.message || "حذف محصول ناموفق بود");
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
            <p className="badge">پنل فروشندگان استایلینو</p>
            <h1 className="text-2xl font-bold text-brand-900">سلام {user?.name}</h1>
            <p className="text-sm text-gray-600">محصولات خود را مدیریت کنید و کمیسیون‌های ارجاع را مشاهده نمایید.</p>
          </div>
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
          <p className="text-sm text-gray-600">درآمد از فروش محصولات</p>
          <p className="text-3xl font-extrabold text-brand-900">{(stats?.revenue ?? 0).toLocaleString()} تومان</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card border border-brand-50 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-900">محصولات</h2>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-brand-50 bg-white">
            <table className="w-full text-right text-sm">
              <thead className="bg-brand-50/70 text-xs font-semibold text-brand-800">
                <tr>
                  <th className="px-4 py-3">نام محصول</th>
                  <th className="px-4 py-3">قیمت</th>
                  <th className="px-4 py-3">دسته</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-semibold text-brand-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {(p.discountPrice ?? p.basePrice).toLocaleString()} تومان
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.categoryName || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="badge">{p.isActive ? "فعال" : "غیرفعال"}</span>
                    </td>
                    <td className="px-4 py-3 space-x-2 space-x-reverse">
                      <button className="text-xs text-red-500" onClick={() => handleDelete(p.id)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
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
              placeholder="توضیحات کوتاه"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="number"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                className="w-full rounded-xl border border-brand-100 px-3 py-2"
                placeholder="قیمت پایه"
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
              <option value="">دسته‌بندی</option>
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
            <input
              value={newProduct.colors}
              onChange={(e) => setNewProduct({ ...newProduct, colors: e.target.value })}
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
              placeholder="رنگ‌ها (با , جدا کنید)"
            />
            <input
              value={newProduct.sizes}
              onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
              placeholder="سایزها (با , جدا کنید)"
            />
            <input
              value={newProduct.images}
              onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
              className="w-full rounded-xl border border-brand-100 px-3 py-2"
              placeholder="لینک تصاویر (با , جدا کنید)"
            />
            <button
              disabled={creating}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-white transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60"
            >
              {creating ? "در حال ذخیره..." : "ثبت محصول"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h4 className="mb-2 text-sm font-semibold text-brand-900">ویرایش قیمت/وضعیت</h4>
            <form className="space-y-2 text-sm" onSubmit={handleUpdateProduct}>
              <select
                required
                value={updateProductForm.productId}
                onChange={(e) => setUpdateProductForm({ ...updateProductForm, productId: e.target.value })}
                className="w-full rounded-xl border border-brand-100 px-3 py-2"
              >
                <option value="">انتخاب محصول</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={updateProductForm.basePrice}
                onChange={(e) => setUpdateProductForm({ ...updateProductForm, basePrice: e.target.value })}
                className="w-full rounded-xl border border-brand-100 px-3 py-2"
                placeholder="قیمت پایه جدید"
              />
              <input
                type="number"
                value={updateProductForm.discountPrice}
                onChange={(e) => setUpdateProductForm({ ...updateProductForm, discountPrice: e.target.value })}
                className="w-full rounded-xl border border-brand-100 px-3 py-2"
                placeholder="قیمت تخفیف"
              />
              <select
                value={updateProductForm.isActive}
                onChange={(e) => setUpdateProductForm({ ...updateProductForm, isActive: e.target.value })}
                className="w-full rounded-xl border border-brand-100 px-3 py-2"
              >
                <option value="true">فعال</option>
                <option value="false">غیرفعال</option>
              </select>
              <button
                disabled={updating}
                className="w-full rounded-xl bg-gray-800 px-4 py-3 text-white transition hover:-translate-y-0.5 hover:bg-gray-900 disabled:opacity-60"
              >
                {updating ? "در حال ذخیره..." : "به‌روزرسانی"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card border border-brand-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">سفارش‌های حاوی محصولات شما</h2>
            <span className="badge">واقعی</span>
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
            <h2 className="text-lg font-semibold text-brand-900">کمیسیون‌های ارجاعی من</h2>
            <span className="badge">سطح ۱ و ۲</span>
          </div>
          {commissions.length === 0 ? (
            <p className="text-sm text-gray-600">کمیسیونی دریافت نشده است.</p>
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
