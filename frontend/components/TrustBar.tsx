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
    <section className="glass-card border border-brand-50 px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-2xl border border-brand-50 bg-gradient-to-l from-white via-white to-brand-50/60 px-3 py-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-soft"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-brand-900">{item.title}</p>
              <p className="text-xs text-gray-600">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
