"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default:
          "border-white/40 bg-white/70 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200",
        luxury:
          "border-white/40 bg-white/80 text-pink-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-pink-400",
      },
      size: {
        sm: "px-2.5 py-1 text-[11px]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

