"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { apiRequest } from "../../lib/api";
import { createZarinpalPayment } from "../../lib/api/payments";

type OrderItemResponse = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type OrderResponse = {
  id: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItemResponse[];
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, getTotalPrice } = useCart();
  const { user, token, loading } = useAuth();
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMobile(user?.phone || "");
    setEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || !token)) {
      router.push("/auth?redirect=/checkout");
    }
  }, [loading, user, token, router]);

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = getTotalPrice();

  const handlePay = async () => {
    setError(null);
    if (!token) {
      router.push("/auth?redirect=/checkout");
      return;
    }
    if (items.length === 0) {
      setError("سبد خرید خالی است.");
      return;
    }
    setSubmitting(true);
    try {
      const trimmedMobile = mobile.trim();
      const trimmedEmail = email.trim();
      const order = await apiRequest<OrderResponse>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          }),
        },
        token
      );
      const amountToman = Math.round(order.totalAmount);
      const payment = await createZarinpalPayment(
        {
          order_id: order.id,
          amount_toman: amountToman,
          description: `پرداخت سفارش شماره ${order.id}`,
          mobile: trimmedMobile || undefined,
          email: trimmedEmail || undefined,
        },
        token
      );
      clearCart();
      window.location.href = payment.payment_url;
    } catch (e: any) {
      setError(e.message || "خطا در ایجاد تراکنش");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-gray-600">در حال بارگذاری...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="glass-card border border-brand-50 p-6">
        <p className="badge">تسویه حساب</p>
        <h1 className="text-2xl font-bold text-brand-900">پرداخت امن با زرین‌پال</h1>
        <p className="text-sm text-gray-600">بعد از تایید، به درگاه زرین‌پال منتقل می‌شوید.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-brand-50 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-900">سبد خرید ({totalQuantity} کالا)</h2>
              <Link href="/" className="text-sm text-brand-700 hover:text-brand-800">
                بازگشت به فروشگاه
              </Link>
            </div>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">سبد خرید خالی است.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between rounded-xl border border-brand-50 px-3 py-3">
                    <div>
                      <p className="font-semibold text-brand-900">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} × {item.price.toLocaleString()} تومان
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-800">
                        {(item.price * item.quantity).toLocaleString()} تومان
                      </span>
                      <button className="text-xs text-red-500" onClick={() => removeItem(item.productId)}>
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-brand-50 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-900">اطلاعات تماس</h2>
            <p className="text-sm text-gray-600">رسید پرداخت به این اطلاعات ارسال می‌شود.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-brand-900">
                موبایل (اختیاری)
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200"
                  placeholder="09xxxxxxxxx"
                />
              </label>
              <label className="space-y-2 text-sm text-brand-900">
                ایمیل (اختیاری)
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200"
                  placeholder="example@email.com"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/40 p-5 shadow-soft">
          <h3 className="text-lg font-semibold text-brand-900">خلاصه پرداخت</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>مجموع کالاها</span>
              <span>{total.toLocaleString()} تومان</span>
            </div>
            <div className="flex items-center justify-between">
              <span>هزینه ارسال</span>
              <span className="text-emerald-700">رایگان</span>
            </div>
            <div className="flex items-center justify-between font-bold text-brand-900">
              <span>مبلغ قابل پرداخت</span>
              <span>{total.toLocaleString()} تومان</span>
            </div>
            <p className="text-xs text-gray-500">
              مبلغ به تومان نمایش داده شده و به ریال برای زرین‌پال ارسال می‌شود.
            </p>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={handlePay}
            disabled={submitting || items.length === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-200"
          >
            {submitting ? "در حال انتقال به درگاه..." : "پرداخت با زرین‌پال"}
          </button>
          <Link
            href="/orders"
            className="mt-3 block text-center text-sm text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            مشاهده سفارش‌های قبلی
          </Link>
        </div>
      </div>
    </div>
  );
}
