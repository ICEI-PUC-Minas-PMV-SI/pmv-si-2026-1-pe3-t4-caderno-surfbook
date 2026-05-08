"use client";

import { ArrowRight, CalendarClock, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PeekShell } from "@/components/feature/peek-shell";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import { getIconComponent } from "@/lib/icons";
import { nodesToSnippet } from "@/lib/markdown-nodes";
import { cn } from "@/lib/utils";
import { noteService, type Note } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";
import { usePeek } from "@/components/feature/peek-provider";

/**
 * Peek de caderno — overview rápido com cover, descrição, tags, prazo e
 * lista resumida das notas. Click numa nota abre o peek dela (encadeado).
 * Botão "abrir página" no shell leva ao detalhe completo.
 */

interface NotebookPeekProps {
  open: boolean;
  notebookId: string | null;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function NotebookPeek({
  open,
  notebookId,
  onOpenChange,
}: NotebookPeekProps) {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const peek = usePeek();

  useEffect(() => {
    if (!open || !notebookId) return;
    setLoading(true);
    Promise.all([
      notebookService.get(notebookId),
      noteService.listByNotebook(notebookId),
    ])
      .then(([nb, ns]) => {
        setNotebook(nb);
        setNotes(ns);
      })
      .finally(() => setLoading(false));
  }, [open, notebookId]);

  const Icon = notebook ? getIconComponent(notebook.iconName) : null;

  return (
    <PeekShell
      open={open}
      onOpenChange={onOpenChange}
      title={notebook?.name ?? "Caderno"}
      description="Visualização rápida do caderno"
      expandHref={notebookId ? `/cadernos/${notebookId}` : undefined}
    >
      {loading ? (
        <p className="text-muted-foreground p-6 text-sm">Carregando…</p>
      ) : !notebook ? (
        <p className="text-muted-foreground p-6 text-sm">
          Caderno não encontrado.
        </p>
      ) : (
        <div className="flex flex-col">
          {notebook.coverUrl && (
            <div className="bg-muted h-32 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={notebook.coverUrl}
                alt={`Capa do caderno ${notebook.name}`}
                className="size-full object-cover"
              />
            </div>
          )}
          <div className="space-y-4 p-6">
            <header className="flex items-start gap-3">
              {Icon && (
                <div className="bg-brand-100 text-brand-700 flex size-10 shrink-0 items-center justify-center rounded">
                  <Icon className="size-5" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {notebook.name}
                </h2>
                {notebook.description && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {notebook.description}
                  </p>
                )}
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link
                  href={`/cadernos/${notebook.id}`}
                  onClick={() => onOpenChange(false)}
                >
                  Abrir caderno
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </header>

            {(notebook.tags.length > 0 || notebook.dueDate) && (
              <div className="flex flex-wrap items-center gap-2">
                {notebook.dueDate && (
                  <span className="bg-amber-100 text-amber-800 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs">
                    <CalendarClock className="size-3" aria-hidden />
                    {formatDate(notebook.dueDate)}
                  </span>
                )}
                {notebook.tags.map((tag) => (
                  <Badge key={tag.id} color={tag.color}>
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            <section>
              <h3 className="text-foreground mb-2 text-sm font-semibold">
                Notas {notes.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({notes.length})
                  </span>
                )}
              </h3>
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma nota ainda.
                </p>
              ) : (
                <ul className="space-y-1">
                  {notes.slice(0, 12).map((n) => {
                    const preview = nodesToSnippet(n.nodes ?? [], 80);
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => peek.openNotePeek(n.id)}
                          className="hover:bg-muted/50 flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors"
                        >
                          <FileText
                            className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm",
                                !n.title.trim() && "text-muted-foreground italic"
                              )}
                            >
                              {n.title.trim() || "Sem título"}
                            </p>
                            {preview && (
                              <p className="text-muted-foreground truncate text-xs">
                                {preview}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                  {notes.length > 12 && (
                    <li className="text-muted-foreground px-2 py-1 text-xs">
                      +{notes.length - 12} notas
                    </li>
                  )}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </PeekShell>
  );
}
