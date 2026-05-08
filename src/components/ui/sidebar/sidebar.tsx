"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const Sidebar = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "bg-surface flex h-screen w-64 shrink-0 flex-col border-r",
      className
    )}
    {...props}
  />
));
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-border flex h-14 shrink-0 items-center border-b px-4",
      className
    )}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-1 overflow-y-auto px-3 py-4",
      "flex flex-col gap-5",
      className
    )}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string }
>(({ className, title, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
    {title && (
      <h4 className="text-muted-foreground px-3 pb-1 text-xs font-medium uppercase tracking-wide">
        {title}
      </h4>
    )}
    {children}
  </div>
));
SidebarSection.displayName = "SidebarSection";

interface SidebarItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  icon?: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  disabled?: boolean;
  hint?: string;
}

const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ className, href, icon: Icon, disabled, hint, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);

    if (disabled) {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          className={cn(
            "text-muted-foreground/60 flex cursor-not-allowed items-center justify-between gap-3 rounded px-3 py-2 text-sm font-medium",
            className
          )}
          aria-disabled
          {...(props as React.HTMLAttributes<HTMLSpanElement>)}
        >
          <span className="flex items-center gap-3">
            {Icon && <Icon className="size-4" aria-hidden />}
            {children}
          </span>
          {hint && <span className="text-xs italic">{hint}</span>}
        </span>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-muted",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
          isActive
            ? "bg-brand-100 text-brand-700"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      >
        {Icon && <Icon className="size-4" aria-hidden />}
        {children}
      </Link>
    );
  }
);
SidebarItem.displayName = "SidebarItem";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-border shrink-0 border-t p-3", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
};
