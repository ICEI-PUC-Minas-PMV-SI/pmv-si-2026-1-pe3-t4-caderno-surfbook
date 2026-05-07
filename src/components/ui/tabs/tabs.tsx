"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface Tab {
  href: string;
  label: string;
  /** Contagem para information scent (ex.: "Notas (12)") */
  count?: number | string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  disabled?: boolean;
  /** Texto auxiliar quando disabled (ex.: "em breve") */
  hint?: string;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Tab[];
}

/**
 * Abas estilo "pasta de arquivos" — aba ativa parece levantada e mergulha no
 * conteúdo abaixo (técnica clássica: \`-mb-px\` + cor da borda inferior igual
 * à da superfície de conteúdo).
 *
 * **Princípios:**
 * - **G2 (Shneiderman 1 — consistência):** mesma metáfora de pasta em todo o app
 * - **G1 (Gestalt — similaridade):** formato de pasta agrupa abas como pertencentes ao mesmo sistema
 * - **Affordance metafórica:** lembra fichários de escritório — alinha-se com produto de estudo
 * - **G3 (acessibilidade):** \`aria-current="page"\`, \`aria-disabled\`, foco visível
 */
export function Tabs({ tabs, className, ...rest }: TabsProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div
      role="tablist"
      className={cn(
        "border-border flex items-end gap-1 border-b px-2",
        className
      )}
      {...rest}
    >
      {tabs.map((tab) => {
        const active = !tab.disabled && isActive(tab.href);
        const Icon = tab.icon;

        const inner = (
          <>
            {Icon && <Icon className="size-4" aria-hidden />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs font-normal",
                  active
                    ? "bg-brand-100 text-brand-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
            {tab.disabled && tab.hint && (
              <span className="text-muted-foreground/70 ml-1 text-xs italic">
                {tab.hint}
              </span>
            )}
          </>
        );

        const baseClasses = cn(
          "relative -mb-px flex items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        );

        if (tab.disabled) {
          return (
            <span
              key={tab.href}
              role="tab"
              aria-disabled
              aria-selected={false}
              className={cn(
                baseClasses,
                "text-muted-foreground/60 cursor-not-allowed border border-transparent"
              )}
            >
              {inner}
            </span>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            className={cn(
              baseClasses,
              active
                ? "bg-surface border-border text-foreground border border-b-surface"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
            )}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Container do conteúdo abaixo das abas. Borda contínua nas laterais e
 * embaixo, cantos inferiores arredondados, sem borda superior (a aba ativa
 * "completa" a borda superior visualmente).
 */
export function TabsContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border bg-surface rounded-b-lg border border-t-0 p-6",
        className
      )}
      {...props}
    />
  );
}
