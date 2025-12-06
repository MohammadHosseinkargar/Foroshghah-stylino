export type DisplayProduct = {
  id: number;
  name: string;
  image?: string;
  price: number;
  oldPrice?: number | null;
  tag?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  products: DisplayProduct[];
  onAdd: (p: DisplayProduct) => void;
  onQuickView?: (p: DisplayProduct) => void;
};

export function ProductSection({ title, subtitle, products, onAdd, onQuickView }: Props) {
  return (
    <section className="space-y-4" id="catalog">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="badge">فروشگاه</p>
          <h2 className="text-lg font-bold text-brand-900 dark:text-white md:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400 md:text-sm">{subtitle}</p>}
        </div>
        <a
          className="text-sm font-semibold text-brand-700 hover:text-brand-900 dark:text-brand-200 dark:hover:text-white"
          href="#catalog"
        >
          مشاهده همه
        </a>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="group flex h-full flex-col gap-3 rounded-2xl border border-brand-50 bg-white/80 p-4 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 dark:hover:shadow-black/50"
          >
            <div
              className="relative aspect-square w-full overflow-hidden rounded-xl bg-brand-50 transition duration-200 group-hover:scale-[1.01] dark:bg-slate-800"
              style={p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
            >
              {!p.image && (
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,#fdeaf3,transparent_35%),radial-gradient(circle_at_80%_0%,#f8cfe5,transparent_30%)] dark:bg-[radial-gradient(circle_at_30%_30%,#1f2937,transparent_35%),radial-gradient(circle_at_80%_0%,#0f172a,transparent_30%)]" />
              )}
              {p.tag && (
                <span className="absolute left-2 top-2 rounded-full bg-gradient-to-l from-brand-600 to-brand-500 px-2 py-1 text-[11px] font-semibold text-white shadow">
                  {p.tag}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-brand-900 dark:text-white sm:text-base">{p.name}</h3>
              <div className="flex items-center gap-2 text-sm text-brand-800 dark:text-slate-200">
                {p.oldPrice ? (
                  <span className="text-xs text-gray-500 line-through dark:text-slate-400">{p.oldPrice.toLocaleString()} تومان</span>
                ) : null}
                <span className="text-base font-bold text-brand-900 dark:text-white sm:text-lg">{p.price.toLocaleString()} تومان</span>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                {[1, 2, 3].map((dot) => (
                  <span key={dot} className="h-3 w-3 rounded-full bg-brand-200 dark:bg-slate-700" />
                ))}
              </div>
              <button
                onClick={() => onAdd(p)}
                className="w-full rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-700 dark:hover:bg-brand-500 sm:w-auto sm:text-sm"
              >
                افزودن به سبد خرید
              </button>
              {onQuickView && (
                <button
                  onClick={() => onQuickView(p)}
                  className="hidden rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 sm:block"
                >
                  جزئیات سریع
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
