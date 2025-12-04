"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", referralCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, login, register, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const redirectByRole = (role: string) => {
    if (redirect) {
      router.push(redirect);
    } else if (role === "SELLER") {
      router.push("/seller");
    } else if (role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      redirectByRole(user.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const signedUser =
        mode === "login"
          ? await login(form.email, form.password)
          : await register({
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
              referralCode: form.referralCode,
            });
      redirectByRole(signedUser.role);
    } catch (err: any) {
      setError(err.message || "خطا در ورود/ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card mx-auto max-w-2xl border border-brand-50 p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="badge">حساب کاربری</p>
          <h1 className="text-2xl font-bold text-brand-900">ورود / ثبت‌نام استایلینو</h1>
        </div>
        <div className="flex gap-2 rounded-full bg-brand-50 p-1 text-xs font-semibold text-brand-800">
          <button
            className={`rounded-full px-3 py-1 ${mode === "login" ? "bg-white shadow" : "opacity-70"}`}
            onClick={() => setMode("login")}
          >
            ورود
          </button>
          <button
            className={`rounded-full px-3 py-1 ${mode === "register" ? "bg-white shadow" : "opacity-70"}`}
            onClick={() => setMode("register")}
          >
            ثبت‌نام
          </button>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "register" && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-brand-900">نام و نام خانوادگی</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                placeholder="نام شما"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-900">شماره تماس (اختیاری)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                placeholder="09xxxxxxxxx"
              />
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-brand-900">ایمیل</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-900">رمز عبور</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              placeholder="حداقل ۸ کاراکتر"
            />
          </div>
        </div>

        {mode === "register" && (
          <div>
            <label className="block text-sm font-semibold text-brand-900">کد دعوت (اختیاری)</label>
            <input
              value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
              className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              placeholder="کد معرف خود را وارد کنید"
            />
            <p className="mt-1 text-xs text-gray-600">با ثبت کد دعوت، معرف شما از سفارش‌های شما پورسانت دریافت می‌کند.</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-white transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-70"
        >
          {mode === "login" ? "ورود به حساب" : "ساخت حساب در استایلینو"}
        </button>
      </form>
    </div>
  );
}
