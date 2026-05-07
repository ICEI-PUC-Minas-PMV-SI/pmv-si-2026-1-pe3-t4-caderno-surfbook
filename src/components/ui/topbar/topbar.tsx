"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Topbar = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "bg-surface sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-6",
      className
    )}
    {...props}
  />
));
Topbar.displayName = "Topbar";

const TopbarLeft = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 items-center gap-3", className)}
    {...props}
  />
));
TopbarLeft.displayName = "TopbarLeft";

const TopbarRight = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
));
TopbarRight.displayName = "TopbarRight";

export { Topbar, TopbarLeft, TopbarRight };
