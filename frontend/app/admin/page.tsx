"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  referralCode: string;
  referredById?: number | null;
};

type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Order = {
  id: number;
  customerId: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

type Commission = { id: number; orderId: number; level: number; amount: number; status: string; toUserId: number; fromUserId: number };
type Stats = { users: number; ordersToday: number; paidCommission: number };

export default function AdminPanel() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN" || !token) {
      router.push("/auth?redirect=/admin");
      return;
    }
    const load = async () => {
      try {
        const [u, o, c, s] = await Promise.all([
          apiRequest<User[]>("/admin/users", undefined, token),
          apiRequest<Order[]>("/admin/orders", undefined, token),
          apiRequest<Commission[]>("/admin/commissions", undefined, token),
          apiRequest<Stats>("/admin/stats", undefined, token),
        ]);
        setUsers(u);
        setOrders(o);
        setCommissions(c);
        setStats(s);
      } catch (e: any) {
        setError(e.message || "خطا در بارگذاری پنل ادمین");
      }
    };
    load();
  }, [loading, token, user, router]);

  const updateRole = async (userId: number, role: User["role"]) => {
    if (!token) return;
    try {
      await apiRequest(`/admin/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) }, token);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (e: any) {
      setError(e.message || "به‌روزرسانی نقش ناموفق بود");
    }
  };

  if (loading) {
    return <p className="text-gray-600">در حال بررسی احراز هویت...</p>;
  }

  return (
    <div className="space-y-10">
      <div className="glass-card border border-brand-50 p-6">
        <p className="badge">پنل مدیریت استایلینو</p>
        <h1 className="text-2xl font-bold text-brand-900">مرکز کنترل</h1>
        <p className="text-sm text-gray-600">مدیریت کاربران، دسته‌بندی‌ها و گزارش کمیسیون‌های ارجاع.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card border border-brand-50 p-4">
          <p className="text-sm text-gray-600">کاربران فعال</p>
          <p className="text-3xl font-extrabold text-brand-900">{stats?.users ?? 0}</p>
        </div>
        <div className="glass-card border border-brand-50 p-4">
          <p className="text-sm text-gray-600">سفارش‌های امروز</p>
          <p className="text-3xl font-extrabold text-brand-900">{stats?.ordersToday ?? 0}</p>
        </div>
        <div className="glass-card border border-brand-50 p-4">
          <p className="text-sm text-gray-600">کمیسیون پرداخت‌شده</p>
          <p className="text-3xl font-extrabold text-brand-900">{(stats?.paidCommission ?? 0).toLocaleString()} تومان</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="glass-card border border-brand-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">کاربران</h2>
          </div>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-brand-50 px-3 py-3">
                <div>
                  <p className="font-semibold text-brand-900">{u.name}</p>
                  <p className="text-xs text-gray-600">کد دعوت: {u.referralCode}</p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value as User["role"])}
                  className="rounded-full border border-brand-200 px-3 py-1 text-xs"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="SELLER">SELLER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card border border-brand-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">گزارش کمیسیون</h2>
            <span className="badge">سطح ۱ و ۲</span>
          </div>
          <div className="space-y-3">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-brand-50/60 px-3 py-3">
                <div>
                  <p className="font-semibold text-brand-900">سفارش #{c.orderId}</p>
                  <p className="text-xs text-brand-700">سطح {c.level}</p>
                </div>
                <span className="text-sm font-bold text-brand-800">{c.amount.toLocaleString()} تومان</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card border border-brand-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-900">سفارش‌ها</h2>
          <span className="badge">واقعی</span>
        </div>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-brand-50 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span>سفارش #{order.id}</span>
                <div className="flex gap-2">
                  <span className="badge">{order.status}</span>
                  <span className="badge">{order.paymentStatus}</span>
                </div>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-gray-700">
                {order.items.map((it) => (
                  <div key={it.productId} className="flex justify-between">
                    <span>
                      {it.productName} × {it.quantity}
                    </span>
                    <span>{it.totalPrice.toLocaleString()} تومان</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-left text-sm text-brand-900">
                مجموع: {order.totalAmount.toLocaleString()} تومان
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
