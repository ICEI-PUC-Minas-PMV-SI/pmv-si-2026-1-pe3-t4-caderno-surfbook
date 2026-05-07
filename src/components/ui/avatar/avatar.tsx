"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

/**
 * Avatar simples com iniciais como fallback. Sem deps externas.
 *
 * Quando `src` é fornecido e carrega, mostra a imagem; senão exibe iniciais
 * em círculo colorido (brand). `aria-label` recebe o nome completo para
 * acessibilidade.
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = "md", className, ...rest }, ref) => {
    const initials = getInitials(name);
    return (
      <div
        ref={ref}
        aria-label={name}
        className={cn(
          "bg-brand-100 text-brand-700 flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium",
          sizeClasses[size],
          className
        )}
        {...rest}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="size-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
