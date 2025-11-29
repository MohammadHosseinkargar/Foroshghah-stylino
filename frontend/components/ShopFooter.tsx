import Link from "next/link";

export function ShopFooter() {
  return (
    <footer className="mt-12 border-t border-pink-50/70 bg-gradient-to-l from-white via-brand-50/40 to-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-brand-900">استایلینو</h3>
          <p className="text-sm text-gray-600">
            استایلینو، انتخاب مطمئن برای استایل زنانه روزمره و شیک. ارسال سریع، پرداخت امن و پشتیبانی همراه شماست.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-brand-900">لینک‌های مهم</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>
              <Link href="#" className="hover:text-brand-700">
                قوانین و مقررات
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-700">
                سوالات متداول
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-700">
                پیگیری سفارش
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-brand-900">شبکه‌های اجتماعی</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>
              <Link href="#" className="hover:text-brand-700">
                اینستاگرام
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-700">
                واتساپ پشتیبانی
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-brand-900">نماد اعتماد</h4>
          <div className="flex h-16 w-24 items-center justify-center rounded-xl border border-brand-100 bg-white text-xs text-gray-500">
            enamad
          </div>
        </div>
      </div>
      <div className="border-t border-brand-50 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} استایلینو | بازار آنلاین مد زنانه
      </div>
    </footer>
  );
}
