"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";

type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Order = {
  id: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

type Commission = {
  id: number;
  orderId: number;
  fromUserId: number;
  toUserId: number;
  level: number;
  amount: number;
  status: string;
};

export default function OrdersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      router.push("/auth?redirect=/orders");
      return;
    }
    if (user.role !== "CUSTOMER") {
      router.push("/");
      return;
    }
    apiRequest<Order[]>("/orders/my", undefined, token)
      .then(setOrders)
      .catch((e) => setError(e.message));
    apiRequest<Commission[]>("/orders/my/commissions", undefined, token)
      .then(setCommissions)
      .catch(() => {});
  }, [loading, token, user, router]);

  if (loading) {
    return <p className="text-gray-600">در حال بررسی احراز هویت...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="glass-card border border-brand-50 p-6">
        <p className="badge">داشبورد مشتری</p>
        <h1 className="text-2xl font-bold text-brand-900">سفارش‌های من</h1>
        {user && (
          <p className="text-sm text-gray-600">
            کد دعوت شما: <span className="font-bold text-brand-800">{user.referralCode}</span>
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-brand-900">سفارش‌ها</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-600">هنوز سفارشی ثبت نشده است.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-brand-50 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">شماره سفارش #{order.id}</span>
                    <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString("fa-IR")}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="badge">{order.status}</span>
                    <span className="badge">{order.paymentStatus}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-gray-700">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between rounded-lg bg-brand-50/50 px-3 py-2">
                      <div>
                        <p className="font-semibold text-brand-900">{item.productName}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity} × {item.unitPrice.toLocaleString()} تومان
                        </p>
                      </div>
                      <span className="font-semibold text-brand-800">{item.totalPrice.toLocaleString()} تومان</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-left text-brand-900">
                  مجموع: <span className="font-bold">{order.totalAmount.toLocaleString()} تومان</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-brand-900">کمیسیون‌های دریافتی من</h2>
          <span className="badge">سطح ۱ و ۲</span>
        </div>
        {commissions.length === 0 ? (
          <p className="text-sm text-gray-600">کمیسیونی دریافت نشده است.</p>
        ) : (
          <div className="space-y-3">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-brand-50 bg-brand-50/50 px-3 py-3">
                <div>
                  <p className="font-semibold text-brand-900">از سفارش #{c.orderId}</p>
                  <p className="text-xs text-brand-700">سطح {c.level}</p>
                </div>
                <span className="text-brand-800">{c.amount.toLocaleString()} تومان</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
