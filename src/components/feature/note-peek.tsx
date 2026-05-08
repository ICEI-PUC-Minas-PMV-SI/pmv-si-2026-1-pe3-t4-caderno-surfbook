"use client";

import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";

import { NoteNodeRenderer } from "@/components/feature/note-node-renderer";
import { PeekShell } from "@/components/feature/peek-shell";
import { Badge } from "@/components/ui/badge/badge";
import { getIconComponent } from "@/lib/icons";
import { noteService, type Note } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

/**
 * Peek de nota — versão somente-leitura. Edição acontece na página completa
 * (acessível pelo botão "abrir página" no shell). Decisão de não embedar o
 * editor: simpler, evita duplicação da lógica de auto-save dentro do peek;
 * pode ser revisitada se feedback de uso pedir edição inline.
 */

interface NotePeekProps {
  open: boolean;
  noteId: string | null;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function NotePeek({ open, noteId, onOpenChange }: NotePeekProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !noteId) return;
    setLoading(true);
    setNote(null);
    setNotebook(null);
    noteService
      .get(noteId)
      .then(async (n) => {
        setNote(n);
        if (n) {
          const nb = await notebookService.get(n.notebookId);
          setNotebook(nb);
        }
      })
      .finally(() => setLoading(false));
  }, [open, noteId]);

  const Icon = notebook ? getIconComponent(notebook.iconName) : null;
  const expandHref =
    note && notebook
      ? `/cadernos/${notebook.id}/notas/${note.id}`
      : undefined;
  const sortedNodes = note
    ? [...note.nodes].sort((a, b) => a.position - b.position)
    : [];

  return (
    <PeekShell
      open={open}
      onOpenChange={onOpenChange}
      title={note?.title || "Nota"}
      description="Visualização rápida da nota"
      expandHref={expandHref}
    >
      {loading ? (
        <p className="text-muted-foreground p-6 text-sm">Carregando…</p>
      ) : !note ? (
        <p className="text-muted-foreground p-6 text-sm">
          Nota não encontrada.
        </p>
      ) : (
        <div className="space-y-4 p-6">
          {notebook && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {Icon && <Icon className="size-3.5" aria-hidden />}
              <span>{notebook.name}</span>
            </div>
          )}

          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {note.title || (
              <span className="text-muted-foreground italic">Sem título</span>
            )}
          </h2>

          {(note.tags.length > 0 || note.dueDate) && (
            <div className="flex flex-wrap items-center gap-2">
              {note.dueDate && (
                <span className="bg-amber-100 text-amber-800 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs">
                  <CalendarClock className="size-3" aria-hidden />
                  {formatDate(note.dueDate)}
                </span>
              )}
              {note.tags.map((tag) => (
                <Badge key={tag.id} color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2">
            {sortedNodes.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">
                Nota vazia.
              </p>
            ) : (
              sortedNodes.map((node) => (
                <NoteNodeRenderer key={node.id} node={node} />
              ))
            )}
          </div>
        </div>
      )}
    </PeekShell>
  );
}
