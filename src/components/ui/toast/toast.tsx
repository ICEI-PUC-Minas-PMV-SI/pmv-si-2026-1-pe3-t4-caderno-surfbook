"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, X, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "danger";
  duration?: number;
}

interface ToastContextValue {
  toast: (data: Omit<ToastData, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((data: Omit<ToastData, "id">) => {
    setToasts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), variant: "default", ...data },
    ]);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
        <ToastPrimitive.Viewport
          className={cn(
            "fixed bottom-4 right-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2",
            "outline-none"
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const variantStyles: Record<NonNullable<ToastData["variant"]>, string> = {
    default: "bg-surface border-border",
    success: "bg-surface border-success/40",
    danger: "bg-surface border-danger/40",
  };

  const Icon =
    toast.variant === "success"
      ? CheckCircle2
      : toast.variant === "danger"
      ? XCircle
      : null;

  const iconColor =
    toast.variant === "success"
      ? "text-success"
      : toast.variant === "danger"
      ? "text-danger"
      : "";

  return (
    <ToastPrimitive.Root
      duration={toast.duration ?? 4000}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border p-4 shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:slide-in-from-right-8 data-[state=closed]:fade-out-80",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform",
        "data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full",
        variantStyles[toast.variant ?? "default"]
      )}
    >
      {Icon && <Icon className={cn("size-5 shrink-0", iconColor)} aria-hidden />}
      <div className="flex-1 space-y-1">
        <ToastPrimitive.Title className="text-sm font-medium leading-tight">
          {toast.title}
        </ToastPrimitive.Title>
        {toast.description && (
          <ToastPrimitive.Description className="text-muted-foreground text-sm">
            {toast.description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close
        className="text-muted-foreground hover:bg-muted -m-1 inline-flex size-7 shrink-0 items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        aria-label="Fechar"
      >
        <X className="size-4" aria-hidden />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
