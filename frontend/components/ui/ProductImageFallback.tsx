"use client";

import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

type ProductImageFallbackProps = {
  altText: string;
  variant?: "minimal" | "3d";
};

export function ProductImageFallback({ altText, variant = "3d" }: ProductImageFallbackProps) {
  const innerGradient =
    variant === "minimal"
      ? "from-white/80 via-white/60 to-white/40 text-pink-500"
      : "from-pink-400/80 via-pink-500/70 to-purple-600/80 text-white";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-50 via-white to-purple-50 text-white shadow-[0_25px_60px_rgba(244,114,182,0.3)] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
    >
      {/* Animated gradient blobs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-8 top-4 h-32 w-32 rounded-full bg-gradient-to-br from-pink-400/40 to-purple-500/40 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 25, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute -right-8 bottom-4 h-28 w-28 rounded-full bg-gradient-to-br from-purple-400/40 to-pink-500/40 blur-3xl"
        />
      </div>

      {/* 3D Icon Container */}
      <motion.div
        whileHover={{ scale: 1.1, rotateY: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${innerGradient} shadow-[0_25px_50px_rgba(244,114,182,0.4)] backdrop-blur-sm`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 to-transparent" />
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ShoppingBag className="h-10 w-10 text-current drop-shadow-lg" />
        </motion.div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/10 to-transparent" />
      </motion.div>

      {/* Text */}
      <p className="relative z-10 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        {altText}
      </p>
    </motion.div>
  );
}
