"use client";
/* eslint-disable react/no-unescaped-entities */

import { Suspense, type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type AuthUser, useAuth } from "../../context/AuthContext";

const ROLE_PATH: Record<AuthUser["role"], string> = {
  CUSTOMER: "/",
  SELLER: "/seller",
  ADMIN: "/admin",
};

function AuthContent() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", referralCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, login, register, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect"), [searchParams]);

  const redirectByRole = (role: AuthUser["role"]) => {
    if (redirect) {
      router.replace(redirect);
      return;
    }
    router.replace(ROLE_PATH[role] ?? "/");
  };

  useEffect(() => {
    if (!authLoading && user) {
      redirectByRole(user.role);
    }
  }, [authLoading, user]);

  const validate = () => {
    if (!form.email.trim()) return "ایمیل را وارد کنید.";
    if (!form.password || form.password.length < 6) return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
    if (mode === "register" && !form.name.trim()) return "نام را وارد کنید.";
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setLoading(true);
    try {
      const signedUser =
        mode === "login"
          ? await login(form.email.trim(), form.password)
          : await register({
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              password: form.password,
              referralCode: form.referralCode.trim(),
            });
      redirectByRole(signedUser.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطا در احراز هویت. دوباره تلاش کنید.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <p className="text-gray-600">در حال بررسی نشست کاربر...</p>;
  }

  return (
    <div className="glass-card mx-auto max-w-2xl border border-brand-50 p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="badge">O-O3OO" UcOO�O"O�UO</p>
          <h1 className="text-2xl font-bold text-brand-900">U^O�U^O_ / O�O"O��?OU+OU. OO3O�OUOU,UOU+U^</h1>
        </div>
        <div className="flex gap-2 rounded-full bg-brand-50 p-1 text-xs font-semibold text-brand-800">
          <button
            className={`rounded-full px-3 py-1 ${mode === "login" ? "bg-white shadow" : "opacity-70"}`}
            onClick={() => setMode("login")}
          >
            U^O�U^O_
          </button>
          <button
            className={`rounded-full px-3 py-1 ${mode === "register" ? "bg-white shadow" : "opacity-70"}`}
            onClick={() => setMode("register")}
          >
            O�O"O��?OU+OU.
          </button>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "register" && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-brand-900">U+OU. U^ U+OU. OrOU+U^OO_U_UO</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                placeholder="U+OU. O'U.O"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-900">O'U.OO�U� O�U.OO3 (OOrO�UOOO�UO)</label>
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
            <label className="block text-sm font-semibold text-brand-900">OUOU.UOU,</label>
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
            <label className="block text-sm font-semibold text-brand-900">O�U.O� O1O\"U^O�</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              placeholder="O-O_OU,U, U, UcOO�OUcO�O�"
            />
          </div>
        </div>

        {mode === "register" && (
          <div>
            <label className="block text-sm font-semibold text-brand-900">UcO_ O_O1U^O� (OOrO�UOOO�UO)</label>
            <input
              value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
              className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              placeholder="UcO_ U.O1O�U? OrU^O_ O�O U^OO�O_ UcU+UOO_"
            />
            <p className="mt-1 text-xs text-gray-600">O\"O O�O\"O� UcO_ O_O1U^O�OO U.O1O�U? O'U.O OO� O3U?OO�O'�?OU�OUO O'U.O U_U^O�O3OU+O� O_O�UOOU?O� U.UO�?OUcU+O_.</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading || authLoading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-white transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-70"
        >
          {loading ? "در حال ارسال..." : mode === "login" ? "ورود" : "ثبت‌نام"}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-card mx-auto max-w-2xl border border-brand-50 p-6 text-center text-sm text-gray-600 sm:p-8">
          در حال بارگذاری حساب کاربری...
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
