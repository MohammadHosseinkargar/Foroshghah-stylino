"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ProductSection, DisplayProduct } from "../../components/ProductSection";
import { QuickViewModal } from "../../components/QuickViewModal";
import { useCart } from "../../context/CartContext";
import { apiRequest } from "../../lib/api";

type Product = {
  id: number;
  sellerId: number;
  name: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  categoryId: number;
  categoryName?: string | null;
  brand: string;
  colors: string[];
  sizes: string[];
  images: string[];
  isActive: boolean;
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query")?.trim() ?? "";
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<DisplayProduct | null>(null);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiRequest<Product[]>("/products")
      .then((result) => {
        if (cancelled) return;
        setProducts(result);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "\u062E\u0637\u0627\u06CC \u0646\u0627\u0634\u0646\u0627\u062E\u062A\u0647";
        setError(message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const results: DisplayProduct[] = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();

    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.discountPrice ?? p.basePrice,
        oldPrice: p.discountPrice ? p.basePrice : null,
        image: p.images?.[0],
        tag: p.discountPrice ? "% \u062A\u062E\u0641\u06CC\u0641" : undefined,
      }));
  }, [products, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="badge">\u062C\u0633\u062A\u062C\u0648</p>
        <h1 className="text-xl font-bold text-brand-900 sm:text-2xl">
          {"\u0646\u062A\u0627\u06CC\u062C \u062C\u0633\u062A\u062C\u0648 \u0628\u0631\u0627\u06CC "}
          {"\u00AB"}
          {query || "\u062C\u0633\u062A\u062C\u0648"}
          {"\u00BB"}
        </h1>
        <p className="text-sm text-gray-600">
          {query
            ? `${results.length} \u0646\u062A\u06CC\u062C\u0647 \u0628\u0631\u0627\u06CC \u00AB${query}\u00BB`
            : "\u0628\u0631\u0627\u06CC \u0634\u0631\u0648\u0639\u060C \u0639\u0628\u0627\u0631\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u0631\u0627 \u062F\u0631 \u0646\u0648\u0627\u0631 \u062C\u0633\u062A\u062C\u0648 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F."}
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0646\u062A\u0627\u06CC\u062C...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && query && results.length === 0 && (
        <div className="rounded-2xl border border-brand-50 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-700">\u0647\u06CC\u0686 \u0646\u062A\u06CC\u062C\u0647\u200C\u0627\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <ProductSection
          title="\u0646\u062A\u0627\u06CC\u062C \u062C\u0633\u062A\u062C\u0648"
          subtitle="\u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0645\u0637\u0627\u0628\u0642 \u0628\u0627 \u062C\u0633\u062A\u062C\u0648\u06CC \u0634\u0645\u0627"
          products={results}
          onAdd={(p) =>
            addItem({
              productId: p.id,
              name: p.name,
              price: p.price,
              image: p.image,
            })
          }
          onQuickView={setQuickView}
        />
      )}

      <QuickViewModal
        open={!!quickView}
        onClose={() => setQuickView(null)}
        product={
          quickView
            ? {
                name: quickView.name,
                price: quickView.price,
                oldPrice: quickView.oldPrice,
                image: quickView.image,
                description:
                  "\u062C\u0632\u0626\u06CC\u0627\u062A \u0628\u06CC\u0634\u062A\u0631 \u062F\u0631 \u0635\u0641\u062D\u0647 \u0645\u062D\u0635\u0648\u0644 \u0642\u0627\u0628\u0644 \u0645\u0634\u0627\u0647\u062F\u0647 \u0627\u0633\u062A.",
              }
            : undefined
        }
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-gray-600">\u062F\u0631 \u062D\u0627\u0644 \u0622\u0645\u0627\u062F\u0647\u200C\u0633\u0627\u0632\u06CC \u0646\u062A\u0627\u06CC\u062C \u062C\u0633\u062A\u062C\u0648...</p>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
