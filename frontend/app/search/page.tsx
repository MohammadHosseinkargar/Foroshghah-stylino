"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductSection, DisplayProduct } from "../../components/ProductSection";
import { useCart } from "../../context/CartContext";
import { apiRequest } from "../../lib/api";
import { QuickViewModal } from "../../components/QuickViewModal";

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

export default function SearchPage() {
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
    setLoading(true);
    setError(null);
    apiRequest<Product[]>("/products")
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
        tag: p.discountPrice ? "%U^UOU~U�" : undefined,
      }));
  }, [products, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="badge">O�O3O�O�U^</p>
        <h1 className="text-xl font-bold text-brand-900 sm:text-2xl">
          O�O3O�O� U+ "{query || "O�O3O�O�U^"}"
        </h1>
        <p className="text-sm text-gray-600">
          {query
            ? `${results.length} O3O�O- O�O"O�`
            : "O�O3O�O�U^ O�O� U.O-O�U^U, O�O�OU^ UO U^ O�O3O�U�O3O�U� O�Uc�?"}
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">O_O� O-OU, O�O3O�O�U^ U.O-O�U^U,OO�...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && query && results.length === 0 && (
        <div className="rounded-2xl border border-brand-50 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-700">O�O3O�O�U^ O�O� U+O�O� U�O�O_ O�O"O� OO3O�.</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <ProductSection
          title="O�O3O�O�U^ O�O�"
          subtitle="O�O�U^ O�U+O� U^ O�O3O�U�O3O�U� O3O�UOO1"
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
                description: "O�U^OUOO-OO� U.OrO�O�O� U.O-O�U^U, O�O�O� O3O�UOO1 O�U,O�.",
              }
            : undefined
        }
      />
    </div>
  );
}
