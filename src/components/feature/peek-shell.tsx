"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Maximize2, PanelRight, SquareArrowOutUpRight, X } from "lucide-react";
import Link from "next/link";

import { Tooltip } from "@/components/ui/tooltip/tooltip";
import { cn } from "@/lib/utils";
import { usePeekMode } from "@/lib/peek-mode";

/**
 * Shell genérico de peek — visualização rápida em diálogo. Suporta dois modos
 * via preferência de usuário (localStorage):
 *
 * - **modal:** centralizado com overlay (Radix Dialog tradicional)
 * - **sidebar:** painel slide-in da direita, ocupando altura total
 *
 * Header fixo com:
 * - Toggle de modo (modal ↔ sidebar)
 * - "Abrir página" (link pra rota completa) — opcional
 * - Fechar
 *
 * Conteúdo do peek é children. Cada tipo (Notebook, Note, Evento) compõe sobre
 * isto provendo seu próprio body.
 */

interface PeekShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título acessível (sr-only se title visual estiver no body). */
  title: string;
  /** Descrição acessível para Radix DialogDescription. */
  description?: string;
  /** Rota da página completa. Se omitida, não mostra "Abrir página". */
  expandHref?: string;
  children: React.ReactNode;
}

export function PeekShell({
  open,
  onOpenChange,
  title,
  description,
  expandHref,
  children,
}: PeekShellProps) {
  const [mode, setMode] = usePeekMode();
  const isSidebar = mode === "sidebar";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "bg-surface fixed z-50 flex flex-col overflow-hidden border shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "focus:outline-none",
            isSidebar
              ? [
                  // Sidebar: full height à direita, slide horizontal
                  "right-0 top-0 h-full w-full max-w-xl",
                  "data-[state=open]:slide-in-from-right",
                  "data-[state=closed]:slide-out-to-right",
                  "border-l",
                ]
              : [
                  // Modal: centralizado com fade+zoom
                  "left-1/2 top-1/2 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg",
                  "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                  "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
                ]
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="sr-only">
              {description}
            </DialogPrimitive.Description>
          )}

          <header className="text-muted-foreground flex shrink-0 items-center justify-end gap-1 border-b px-2 py-1.5">
            <Tooltip
              content={
                isSidebar ? "Mudar pra modal" : "Mudar pra sidebar"
              }
            >
              <button
                type="button"
                onClick={() => setMode(isSidebar ? "modal" : "sidebar")}
                className="hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded transition-colors"
                aria-label={
                  isSidebar ? "Abrir como modal" : "Abrir como sidebar"
                }
              >
                {isSidebar ? (
                  <Maximize2 className="size-3.5" aria-hidden />
                ) : (
                  <PanelRight className="size-3.5" aria-hidden />
                )}
              </button>
            </Tooltip>

            {expandHref && (
              <Tooltip content="Abrir página">
                <Link
                  href={expandHref}
                  onClick={() => onOpenChange(false)}
                  className="hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded transition-colors"
                  aria-label="Abrir página completa"
                >
                  <SquareArrowOutUpRight
                    className="size-3.5"
                    aria-hidden
                  />
                </Link>
              </Tooltip>
            )}

            <DialogPrimitive.Close
              className="hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded transition-colors"
              aria-label="Fechar"
            >
              <X className="size-3.5" aria-hidden />
            </DialogPrimitive.Close>
          </header>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
