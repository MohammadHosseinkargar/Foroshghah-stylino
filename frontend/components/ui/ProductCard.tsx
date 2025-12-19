"use client";

import { Heart, ShoppingBag, Eye } from "lucide-react";
import { motion, type HTMLMotionProps } from "framer-motion";
import * as React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { ProductImageFallback } from "./ProductImageFallback";

export interface ProductCardProps extends Omit<HTMLMotionProps<"div">, "id" | "ref"> {
  id: number;
  name: string;
  price: number;
  oldPrice?: number | null;
  image?: string;
  tag?: string;
  discountPercent?: number;
  onAddToCart?: () => void;
  onQuickView?: () => void;
  onAddToWishlist?: () => void;
  isInWishlist?: boolean;
}

export function ProductCard({
  id: productId,
  name,
  price,
  oldPrice,
  image,
  tag,
  discountPercent,
  onAddToCart,
  onQuickView,
  onAddToWishlist,
  isInWishlist = false,
  className,
  ...props
}: ProductCardProps) {
  const hasDiscount = !!oldPrice && oldPrice > price;
  const discount = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : discountPercent;

  return (
    <motion.div
      initial={{ y: 0, rotateX: 0, rotateY: 0 }}
      whileHover={{ 
        y: -12, 
        scale: 1.02,
        rotateX: -3,
        rotateY: 2,
      }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      data-product-id={productId}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-white via-pink-50/40 to-white shadow-[0_25px_70px_rgba(15,23,42,0.18)] ring-1 ring-white/60 backdrop-blur dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 dark:ring-slate-800",
        "transform-gpu will-change-transform",
        "hover:shadow-[0_35px_90px_rgba(244,114,182,0.35)]",
        className
      )}
      style={{ transformStyle: "preserve-3d", perspective: 1200 }}
      {...props}
    >
      {/* 3D depth overlay */}
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/40 via-transparent to-pink-200/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      {/* Image Container */}
      <div className="relative overflow-hidden p-2">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative aspect-square w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-50 via-white to-pink-50 shadow-[0_15px_40px_rgba(244,114,182,0.2)] dark:bg-slate-900/80 dark:from-slate-900"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="h-full w-full" style={{ perspective: 1000 }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <motion.img
                src={image}
                alt={name}
                whileHover={{ scale: 1.08, rotateY: 2 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full object-cover"
                style={{ transformStyle: "preserve-3d" }}
              />
            ) : (
              <ProductImageFallback altText={name} variant="3d" />
            )}
          </div>

          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-600/25 to-purple-600/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </motion.div>

        <motion.div 
          className="absolute left-3 top-3 flex flex-col gap-2 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {discount && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Badge variant="luxury" size="sm" className="bg-white/90 text-pink-600 shadow-[0_10px_30px_rgba(244,114,182,0.4)] dark:text-pink-400">
                {discount}% {"\u062A\u062E\u0641\u06CC\u0641"}
              </Badge>
            </motion.div>
          )}
          {tag && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Badge variant="default" size="sm" className="bg-white/80 text-slate-900 shadow-lg dark:text-slate-200">
                {tag}
              </Badge>
            </motion.div>
          )}
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition duration-300 group-hover:bg-black/30">
          <div className="flex translate-y-6 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {onQuickView && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  onQuickView();
                }}
                className="rounded-full bg-white/90 px-2 py-2 text-slate-900 shadow-lg"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onAddToWishlist && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  onAddToWishlist();
                }}
                className="rounded-full bg-white/90 px-2 py-2 text-error-500 shadow-lg"
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-3 text-right">
        <h3 className="line-clamp-2 text-sm font-black text-slate-900 dark:text-white sm:text-base">{name}</h3>
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-pink-600 dark:text-pink-400">
            {price.toLocaleString("fa-IR")} تومان
          </span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through dark:text-slate-500">
              {oldPrice?.toLocaleString("fa-IR")} تومان
            </span>
          )}
        </div>
        <motion.div 
          className="mt-auto"
          whileHover={{ scale: 1.02 }}
        >
          {onAddToCart && (
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="primary"
                size="sm"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  onAddToCart();
                }}
                className="relative w-full overflow-hidden rounded-[22px] bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 shadow-[0_20px_50px_rgba(219,39,119,0.4)] transition duration-300 hover:shadow-[0_25px_60px_rgba(219,39,119,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity hover:opacity-100" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  {"\u0627\u0641\u0632\u0648\u062F\u0646 \u0628\u0647 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F"}</span>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}




