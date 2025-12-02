import Link from "next/link";

type SearchParams = {
  status?: string;
  orderId?: string;
  refId?: string;
  amount?: string;
  message?: string;
  code?: string;
};

export default function PaymentResultPage({ searchParams }: { searchParams: SearchParams }) {
  const status = searchParams.status || "failed";
  const success = status === "success";
  const orderId = searchParams.orderId;
  const refId = searchParams.refId;
  const amount = searchParams.amount ? Number(searchParams.amount) : undefined;
  const message = searchParams.message ? searchParams.message.replace(/\+/g, " ") : undefined;
  const code = searchParams.code;

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-brand-50 bg-white p-8 text-center shadow-soft">
      <div className="flex flex-col items-center gap-3">
        {success ? (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">✔</div>
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600">!</div>
        )}
        <h1 className="text-2xl font-bold text-brand-900">
          {success ? "پرداخت با موفقیت انجام شد" : "پرداخت ناموفق بود یا توسط کاربر لغو شد"}
        </h1>
        <p className="text-sm text-gray-600">
          {success
            ? "سفارش شما ثبت شد و رسید پرداخت در اختیار شماست."
            : "در صورت کسر وجه، تراکنش معلق ممکن است ظرف چند دقیقه برگردد."}
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-brand-50 bg-brand-50/50 p-4 text-sm text-brand-900 md:grid-cols-3">
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">شماره سفارش</p>
          <p className="font-semibold">{orderId || "-"}</p>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">مبلغ پرداختی</p>
          <p className="font-semibold">{amount ? `${amount.toLocaleString()} تومان` : "-"}</p>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">کد پیگیری (RefID)</p>
          <p className="font-semibold">{refId || (success ? "در حال دریافت..." : "-")}</p>
        </div>
      </div>

      {!success && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-right text-sm text-red-700">
          <p className="font-semibold">جزئیات خطا</p>
          <p className="mt-1">{message || "متاسفیم، پرداخت انجام نشد."}</p>
          {code && <p className="text-xs text-red-600">کد خطا: {code}</p>}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center">
        <Link
          href="/orders"
          className="rounded-full bg-brand-600 px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700"
        >
          مشاهده سفارش
        </Link>
        <Link
          href="/"
          className="rounded-full border border-brand-100 px-5 py-3 text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-50"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  );
}
