type Testimonial = {
  name: string;
  city: string;
  text: string;
  rating: number;
};

type Props = {
  items: Testimonial[];
};

export function Testimonials({ items }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="badge">اعتماد مشتریان</p>
        <h2 className="text-xl font-bold text-brand-900">نظرات مشتریان</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((t) => (
          <div key={t.name} className="glass-card border border-brand-50 p-4 transition hover:-translate-y-1 hover:shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
                  {t.name[0]}
                </span>
                <div>
                  <p className="font-semibold text-brand-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.city}</p>
                </div>
              </div>
              <div className="text-xs text-amber-500">
                {"★".repeat(t.rating)}
                {"☆".repeat(5 - t.rating)}
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-700">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
