import { useState } from "react";

type Props = {
  categories: { name: string; slug: string }[];
};

export function CategoryStrip({ categories }: Props) {
  const [active, setActive] = useState(categories[0]?.slug);

  return (
    <section className="glass-card border border-brand-50 p-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActive(cat.slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              active === cat.slug
                ? "bg-brand-600 text-white shadow-soft"
                : "bg-brand-50 text-brand-800 hover:-translate-y-0.5 hover:bg-brand-100"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </section>
  );
}
