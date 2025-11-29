export function WhyStylino() {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-white via-brand-50/60 to-white p-6 shadow-soft">
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="order-2 md:order-1 space-y-2">
          <p className="badge mb-1">چرا استایلینو؟</p>
          <h2 className="text-2xl font-bold text-brand-900">انتخابی مطمئن برای استایل زنانه</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
              محصولات curated از فروشندگان منتخب با تمرکز بر کیفیت پارچه، دوخت و تنخور.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
              ارسال سریع، بسته‌بندی شکیل و پشتیبانی واتساپ برای پاسخ فوری.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
              سیستم ارجاع دو سطحی با پورسانت شفاف ۱۰٪ و ۵٪ پس از پرداخت سفارش‌ها.
            </li>
          </ul>
        </div>
        <div className="order-1 md:order-2 h-40 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,#fdeaf3,transparent_40%),radial-gradient(circle_at_80%_0%,#f8cfe5,transparent_35%)] md:h-56" />
      </div>
    </section>
  );
}
