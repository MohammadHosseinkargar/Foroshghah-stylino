"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type WishlistItem = {
  productId: number;
  name?: string;
  image?: string;
  price?: number;
};

type WishlistContextType = {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: number) => void;
  toggleItem: (item: WishlistItem) => void;
  clear: () => void;
  exists: (productId: number) => boolean;
  count: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_KEY = "stylino_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(WISHLIST_KEY) : null;
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
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = (item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((w) => w.productId === item.productId)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((w) => w.productId !== productId));
  };

  const toggleItem = (item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.some((w) => w.productId === item.productId);
      return exists ? prev.filter((w) => w.productId !== item.productId) : [...prev, item];
    });
  };

  const clear = () => setItems([]);

  const exists = (productId: number) => items.some((w) => w.productId === productId);

  const count = useMemo(() => items.length, [items]);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, toggleItem, clear, exists, count }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
