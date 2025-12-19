"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type AuthUser } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

const ROLE_PATHS: Record<AuthUser["role"], string> = {
  CUSTOMER: "/",
  SELLER: "/seller",
  ADMIN: "/admin",
};

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, loading, user } = useAuth();

  const redirect = searchParams.get("redirect");
  const redirectPath = useMemo(() => redirect || (user ? ROLE_PATHS[user.role] : "/"), [redirect, user]);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectPath);
    }
  }, [loading, user, redirectPath, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password;

      if (!trimmedEmail || !trimmedPassword) {
        setError("ایمیل و رمز عبور الزامی است.");
        return;
      }

      if (mode === "login") {
        const me = await login(trimmedEmail, trimmedPassword);
        router.replace(redirect || ROLE_PATHS[me.role]);
        return;
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("نام و نام خانوادگی الزامی است.");
        return;
      }

      const me = await register({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim() || undefined,
        password: trimmedPassword,
        referralCode: referralCode.trim() || undefined,
      });
      router.replace(redirect || ROLE_PATHS[me.role]);
    } catch (e: any) {
      setError(e?.message || "خطا در انجام عملیات.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="glass-card border border-brand-50 p-6 text-right">
        <p className="badge">حساب کاربری</p>
        <h1 className="text-2xl font-bold text-brand-900">ورود / ثبت‌نام</h1>
        <p className="mt-2 text-sm text-gray-600">برای ثبت سفارش و مدیریت سفارش‌ها وارد شوید.</p>
      </div>

      <div className="rounded-3xl border border-brand-50 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
              mode === "login"
                ? "bg-brand-600 text-white shadow-soft"
                : "bg-brand-50 text-brand-800 ring-1 ring-brand-100 hover:bg-brand-100 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700"
            )}
          >
            ورود
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
              mode === "register"
                ? "bg-brand-600 text-white shadow-soft"
                : "bg-brand-50 text-brand-800 ring-1 ring-brand-100 hover:bg-brand-100 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700"
            )}
          >
            ثبت‌نام
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <label className="block space-y-2 text-sm text-brand-900 dark:text-slate-100">
              نام و نام خانوادگی
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
                placeholder="مثلاً: سارا احمدی"
                autoComplete="name"
              />
            </label>
          )}

          <label className="block space-y-2 text-sm text-brand-900 dark:text-slate-100">
            ایمیل
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
              placeholder="example@email.com"
              autoComplete="email"
              inputMode="email"
            />
          </label>

          {mode === "register" && (
            <label className="block space-y-2 text-sm text-brand-900 dark:text-slate-100">
              موبایل (اختیاری)
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
                placeholder="09xxxxxxxxx"
                autoComplete="tel"
                inputMode="tel"
              />
            </label>
          )}

          <label className="block space-y-2 text-sm text-brand-900 dark:text-slate-100">
            رمز عبور
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
              placeholder="••••••••"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "register" && (
            <label className="block space-y-2 text-sm text-brand-900 dark:text-slate-100">
              کد معرف (اختیاری)
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full rounded-xl border border-brand-100 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
                placeholder="کد معرف"
                autoComplete="off"
              />
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-200 dark:hover:bg-brand-500"
          >
            {submitting ? "در حال ارسال..." : mode === "login" ? "ورود" : "ثبت‌نام"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="h-24" />}>
      <AuthPageInner />
    </Suspense>
  );
}
