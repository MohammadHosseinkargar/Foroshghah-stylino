"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../../context/CartContext";

type Product = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  categoryName?: string | null;
  colors: string[];
  sizes: string[];
  images: string[];
};

export default function ProductDetailsClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();

  const addToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.discountPrice ?? product.basePrice,
      quantity: 1,
      image: product.images?.[0],
    });
    router.push("/#catalog");
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border border-brand-50 p-6">
        <p className="badge">{product.categoryName || "محصول"}</p>
        <h1 className="text-3xl font-bold text-brand-900">{product.name}</h1>
        <p className="text-gray-600">{product.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-brand-900">
          {product.discountPrice ? (
            <>
              <span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
                {product.discountPrice.toLocaleString()} تومان
              </span>
              <span className="text-xs text-gray-500 line-through">{product.basePrice.toLocaleString()} تومان</span>
            </>
          ) : (
            <span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
              {product.basePrice.toLocaleString()} تومان
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
          {product.colors?.map((c) => (
            <span key={c} className="rounded-full bg-gray-100 px-3 py-1">
              {c}
            </span>
          ))}
          {product.sizes?.map((s) => (
            <span key={s} className="rounded-full border border-brand-100 px-3 py-1">
              سایز {s}
            </span>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={addToCart}
            className="rounded-full bg-brand-600 px-5 py-3 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700"
          >
            افزودن به سبد خرید
          </button>
          <Link href="/" className="rounded-full border border-brand-200 px-5 py-3 text-brand-800 hover:bg-brand-50">
            بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    </div>
  );
}
