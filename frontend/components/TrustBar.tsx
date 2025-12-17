type TrustItem = {
  title: string;
  desc: string;
  icon: string;
};

type Props = {
  items: TrustItem[];
};

export function TrustBar({ items }: Props) {
  return (
    <section className="glass-card border border-brand-50 px-4 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-2xl border border-brand-50 bg-gradient-to-l from-white via-white to-brand-50/60 px-3 py-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/70 dark:text-slate-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-xl dark:bg-slate-800">
              {item.icon}
            </span>
            <div>
              <p className="font-semibold text-brand-900 dark:text-white">{item.title}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
