import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  pill?: string;
  image?: string;
};

export function HeroBanner({ title, subtitle, ctaLabel, pill = "حراج تابستانه استایلینو", image }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 text-slate-100 shadow-xl ring-1 ring-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(247,140,178,0.15),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(244,114,182,0.12),transparent_30%)]" />
        {image ? (
          <div style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }} className="absolute inset-0 mix-blend-overlay" />
        ) : null}
      </div>
      <div className="relative z-10 grid gap-6 px-5 py-8 sm:px-7 sm:py-10 md:grid-cols-2 md:items-center md:px-10 md:py-12">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur">
            {pill}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="text-base text-slate-200 sm:text-lg">{subtitle}</p>
          <Link
            href="#catalog"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:-translate-y-0.5 hover:bg-brand-400"
          >
            {ctaLabel}
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
          <div className="space-y-3 text-sm text-slate-200">
            <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-3 ring-1 ring-white/10">
              <div>
                <p className="font-semibold text-white">سطح اول</p>
                <p className="text-xs text-slate-300">خرید مستقیم با کد شما</p>
              </div>
              <span className="text-lg font-bold text-brand-100">۱۰٪</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
              <div>
                <p className="font-semibold text-white">سطح دوم</p>
                <p className="text-xs text-slate-300">خرید زیرمجموعه‌های مستقیم</p>
              </div>
              <span className="text-lg font-bold text-brand-100">۵٪</span>
            </div>
            <p className="text-xs text-slate-300">
              پورسانت بعد از پرداخت سفارش ثبت می‌شود و عمق زنجیره حداکثر ۲ است.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
