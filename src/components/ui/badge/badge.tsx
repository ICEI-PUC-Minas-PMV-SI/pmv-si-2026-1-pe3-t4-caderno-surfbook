"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-foreground",
        brand: "bg-brand-100 text-brand-700",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
  /**
   * Cor customizada (hex) — usada para tags de caderno que carregam cor própria.
   * Quando setada, ignora `variant`.
   */
  color?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, color, style, children, ...props }, ref) => {
    if (color) {
      return (
        <span
          ref={ref}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium leading-none text-white",
            className
          )}
          style={{ backgroundColor: color, ...style }}
          {...props}
        >
          {children}
        </span>
      );
    }
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        style={style}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
