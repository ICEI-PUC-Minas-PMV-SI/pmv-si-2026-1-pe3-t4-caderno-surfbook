"use client";

import { cn } from "@/lib/utils";

/**
 * Checkbox inline de conclusão — usado nos headers do caderno e da nota
 * (e em qualquer item com `dueDate`). Visualmente compacto, mostra estado
 * "pendente" como caixa aberta e "cumprido em <data>" quando marcado.
 *
 * Lógica de toggling fica no chamador (passa `completedAt` + `onChange`)
 * — assim o componente é puro e funciona pra notebook/note/event.
 */

interface CompletionCheckboxProps {
  completedAt?: string | null;
  onChange: (completedAt: string | null) => void;
  /** Texto quando não cumprido. Default: "Marcar como cumprido". */
  pendingLabel?: string;
  className?: string;
}

function formatCompletedAt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CompletionCheckbox({
  completedAt,
  onChange,
  pendingLabel = "Marcar como cumprido",
  className,
}: CompletionCheckboxProps) {
  const isCompleted = !!completedAt;
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-sm transition-colors",
        isCompleted
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          : "border-border hover:bg-muted/60",
        className
      )}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={(e) =>
          onChange(e.target.checked ? new Date().toISOString() : null)
        }
        className="border-border accent-brand-500 size-4 rounded"
      />
      <span>
        {isCompleted ? (
          <>
            Cumprido em <strong>{formatCompletedAt(completedAt!)}</strong>
          </>
        ) : (
          pendingLabel
        )}
      </span>
    </label>
  );
}
