"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { EventFormDialog } from "@/components/feature/event-form-dialog";
import { NotebookPeek } from "@/components/feature/notebook-peek";
import { NotePeek } from "@/components/feature/note-peek";
import { TaskFormDialog } from "@/components/feature/task-form-dialog";

/**
 * Peek dispatcher — qualquer componente pode invocar `usePeek()` pra abrir
 * uma visualização rápida de caderno, nota ou evento sem sair da página
 * corrente. O Provider hospeda o estado e renderiza o shell apropriado.
 *
 * Padrão Notion: clicar no card/chip abre peek; o shell tem botão "abrir
 * página" pra navegação completa quando o usuário quiser sair daquele
 * contexto.
 */

interface PeekContextValue {
  openNotebookPeek: (id: string) => void;
  openNotePeek: (id: string) => void;
  openEventPeek: (id: string) => void;
  openEventNew: (defaultNotebookId?: string) => void;
  openTaskEdit: (id: string) => void;
  openTaskNew: (defaultParentId?: string, defaultNotebookId?: string) => void;
  close: () => void;
}

const PeekContext = createContext<PeekContextValue | null>(null);

type PeekState =
  | { kind: "none" }
  | { kind: "notebook"; id: string }
  | { kind: "note"; id: string }
  | { kind: "event"; id: string }
  | { kind: "event-new"; defaultNotebookId?: string }
  | { kind: "task"; id: string }
  | {
      kind: "task-new";
      defaultParentId?: string;
      defaultNotebookId?: string;
    };

export function PeekProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PeekState>({ kind: "none" });

  const close = useCallback(() => setState({ kind: "none" }), []);

  const value: PeekContextValue = {
    openNotebookPeek: (id) => setState({ kind: "notebook", id }),
    openNotePeek: (id) => setState({ kind: "note", id }),
    openEventPeek: (id) => setState({ kind: "event", id }),
    openEventNew: (defaultNotebookId) =>
      setState({ kind: "event-new", defaultNotebookId }),
    openTaskEdit: (id) => setState({ kind: "task", id }),
    openTaskNew: (defaultParentId, defaultNotebookId) =>
      setState({ kind: "task-new", defaultParentId, defaultNotebookId }),
    close,
  };

  return (
    <PeekContext.Provider value={value}>
      {children}
      <NotebookPeek
        open={state.kind === "notebook"}
        notebookId={state.kind === "notebook" ? state.id : null}
        onOpenChange={(o) => !o && close()}
      />
      <NotePeek
        open={state.kind === "note"}
        noteId={state.kind === "note" ? state.id : null}
        onOpenChange={(o) => !o && close()}
      />
      <EventFormDialog
        open={state.kind === "event" || state.kind === "event-new"}
        onOpenChange={(o) => !o && close()}
        eventId={state.kind === "event" ? state.id : null}
        defaultNotebookId={
          state.kind === "event-new" ? state.defaultNotebookId : undefined
        }
      />
      <TaskFormDialog
        open={state.kind === "task" || state.kind === "task-new"}
        onOpenChange={(o) => !o && close()}
        taskId={state.kind === "task" ? state.id : null}
        defaultParentId={
          state.kind === "task-new" ? state.defaultParentId : undefined
        }
        defaultNotebookId={
          state.kind === "task-new" ? state.defaultNotebookId : undefined
        }
      />
    </PeekContext.Provider>
  );
}

export function usePeek(): PeekContextValue {
  const ctx = useContext(PeekContext);
  if (!ctx) {
    throw new Error("usePeek deve ser usado dentro de <PeekProvider>");
  }
  return ctx;
}

/**
 * Helper de click handler — preserva ctrl/cmd/middle-click pra abrir em
 * nova aba (default do browser); intercepta click normal e dispara o peek.
 */
export function peekClickHandler(open: () => void) {
  return (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || (e as React.MouseEvent).button === 1) {
      return; // browser handles
    }
    e.preventDefault();
    open();
  };
}
