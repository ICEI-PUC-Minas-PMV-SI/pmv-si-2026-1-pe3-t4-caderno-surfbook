"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ícone decorativo (lucide ou React node) */
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Botão / CTA */
  action?: React.ReactNode;
  /** Dica curta (ex.: atalho de teclado) abaixo da ação */
  hint?: React.ReactNode;
}

/**
 * Componente reutilizável para listas/áreas vazias.
 *
 * **Princípios aplicados:**
 * - **G4 (comunicabilidade):** comunica explicitamente o que está vazio e o que fazer
 * - **G5 (centrado no usuário):** CTA primário visível, próximo ao texto explicativo (Gestalt: proximidade)
 * - **G2 (Shneiderman 8 — reduzir carga):** descrição curta + dica de atalho, sem manuais separados
 *
 * **Resolve do eixo-1 (E6):** mensagens vazias eram só imagem solta + texto;
 * agora há um padrão consistente que sempre oferece o próximo passo.
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, hint, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-surface flex flex-col items-center gap-3 rounded-lg border px-6 py-12 text-center",
        className
      )}
      role="status"
      {...props}
    >
      {icon && (
        <div className="bg-brand-100 text-brand-700 flex size-14 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
      <h2 className="font-display text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
      {hint && (
        <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
