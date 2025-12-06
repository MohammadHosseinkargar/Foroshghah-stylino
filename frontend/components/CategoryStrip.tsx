import { useState } from "react";

type Props = {
  categories: { name: string; slug: string }[];
};

export function CategoryStrip({ categories }: Props) {
  const [active, setActive] = useState(categories[0]?.slug);

  return (
    <section className="glass-card border border-brand-50 p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActive(cat.slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              active === cat.slug
                ? "bg-brand-600 text-white shadow-soft dark:bg-brand-500"
                : "bg-brand-50 text-brand-800 ring-1 ring-brand-100 hover:-translate-y-0.5 hover:bg-brand-100 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </section>
  );
}
