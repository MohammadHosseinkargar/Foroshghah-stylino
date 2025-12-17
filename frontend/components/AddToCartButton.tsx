"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  id: number;
  title: string;
  price: number;
}

export function AddToCartButton({ id, title, price }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();

  const handleClick = () => {
    addItem({ productId: id, name: title, price });
    router.push("/orders");
  };

  return (
    <button
      onClick={handleClick}
      className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      افزودن به سبد خرید
    </button>
  );
}
