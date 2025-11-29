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
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand-50 via-white to-white shadow-soft">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-white/60 backdrop-blur" />
        <div
          className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,#fdeaf3,transparent_30%),radial-gradient(circle_at_80%_0%,#f8cfe5,transparent_25%)]"
          style={image ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        />
      </div>
      <div className="relative z-10 grid gap-6 px-6 py-10 md:grid-cols-2 md:items-center md:px-10 md:py-14 animate-fade-in">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-brand-800 shadow-sm">
            {pill}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-brand-900 md:text-4xl lg:text-5xl">{title}</h1>
          <p className="text-lg text-brand-800">{subtitle}</p>
          <Link
            href="#catalog"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700"
          >
            {ctaLabel}
          </Link>
        </div>
        <div className="rounded-2xl border border-brand-100/70 bg-white/80 p-4 shadow-soft">
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-3">
              <div>
                <p className="font-semibold text-brand-900">سطح اول</p>
                <p className="text-xs text-brand-700">خرید مستقیم با کد شما</p>
              </div>
              <span className="text-lg font-bold text-brand-800">۱۰٪</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
              <div>
                <p className="font-semibold text-gray-900">سطح دوم</p>
                <p className="text-xs text-gray-600">خرید زیرمجموعه‌های مستقیم</p>
              </div>
              <span className="text-lg font-bold text-gray-800">۵٪</span>
            </div>
            <p className="text-xs text-gray-600">پورسانت بعد از پرداخت سفارش ثبت می‌شود و عمق زنجیره حداکثر ۲ است.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
