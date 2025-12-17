"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartProductInput = {
  productId: number;
  name: string;
  price: number;
  image?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: CartProductInput, quantity?: number) => void;
  removeItem: (productId: number) => void;
  decrementItem: (productId: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalCount: () => number;
  isEmpty: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "stylino_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(CART_KEY) : null;
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (_e) {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = (product: CartProductInput, quantity = 1) => {
    const safeQuantity = quantity > 0 ? quantity : 1;
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === product.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === product.productId ? { ...p, quantity: p.quantity + safeQuantity } : p
        );
      }
      return [...prev, { ...product, quantity: safeQuantity }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const decrementItem = (productId: number) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((p) => p.productId !== productId);
      }
      return prev.map((p) => (p.productId === productId ? { ...p, quantity: p.quantity - 1 } : p));
    });
  };

  const clearCart = () => setItems([]);

  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const isEmpty = items.length === 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        decrementItem,
        clearCart,
        getTotalPrice: () => totalPrice,
        getTotalCount: () => totalCount,
        isEmpty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
