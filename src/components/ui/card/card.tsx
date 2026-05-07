"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-surface rounded-lg border shadow-sm overflow-hidden transition-shadow",
  {
    variants: {
      variant: {
        default: "",
        interactive:
          "hover:shadow-md cursor-pointer hover:border-brand-300 focus-within:shadow-md",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-lg font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 p-5 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/**
 * Capa do card — banda visual no topo (estilo Trello).
 * Aceita imagem (`src`) OU cor sólida (`color`). Render de imagem usa <img>
 * nativo (não next/image) para suportar URLs arbitrárias sem whitelist.
 *
 * Princípio: G1 (similaridade) — capas dão identidade visual à entidade,
 * facilitando reconhecimento numa lista densa.
 */
const cardCoverVariants = cva("relative w-full bg-muted", {
  variants: {
    height: {
      sm: "h-16",
      md: "h-24",
      lg: "h-36",
    },
  },
  defaultVariants: { height: "md" },
});

export interface CardCoverProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof cardCoverVariants> {
  src?: string;
  color?: string;
  alt?: string;
}

const CardCover = React.forwardRef<HTMLDivElement, CardCoverProps>(
  (
    { className, height, src, color, alt = "", style, children, ...props },
    ref
  ) => {
    const [failed, setFailed] = React.useState(false);
    const showImage = !!src && !failed;
    const fallbackColor = color ?? "var(--brand-100)";

    return (
      <div
        ref={ref}
        className={cn(cardCoverVariants({ height }), className)}
        style={
          showImage ? style : { backgroundColor: fallbackColor, ...style }
        }
        {...props}
      >
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {children}
      </div>
    );
  }
);
CardCover.displayName = "CardCover";

export {
  Card,
  CardCover,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  cardCoverVariants,
};
