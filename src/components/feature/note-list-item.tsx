"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge/badge";
import { getIconComponent } from "@/lib/icons";
import { nodesToSnippet } from "@/lib/markdown-nodes";
import { cn } from "@/lib/utils";
import type { Note } from "@/services/note-service";
import type { Notebook } from "@/services/notebook-service";

interface NoteListItemProps {
  note: Note;
  notebookId: string;
  /** Quando presente, mostra contexto do caderno (útil em listagens globais). */
  notebook?: Pick<Notebook, "name" | "iconName">;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD}d`;
  return date.toLocaleDateString("pt-BR");
}

export function NoteListItem({ note, notebookId, notebook }: NoteListItemProps) {
  const title = note.title.trim() || "Sem título";
  const preview = nodesToSnippet(note.nodes ?? []);
  const NotebookIcon = notebook ? getIconComponent(notebook.iconName) : null;

  return (
    <Link
      href={`/cadernos/${notebookId}/notas/${note.id}`}
      className={cn(
        "bg-surface group flex flex-col gap-1.5 rounded-lg border p-4 transition-colors",
        "hover:border-brand-300 hover:shadow-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      )}
    >
      {notebook && (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {NotebookIcon && <NotebookIcon className="size-3" aria-hidden />}
          <span className="truncate">{notebook.name}</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "font-display text-base font-semibold leading-tight",
            !note.title.trim() && "text-muted-foreground italic"
          )}
        >
          {title}
        </h3>
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatRelativeDate(note.updatedAt)}
        </span>
      </div>
      {preview && (
        <p className="text-muted-foreground line-clamp-2 text-sm">{preview}</p>
      )}
      {note.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <Badge key={tag.id} color={tag.color}>
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
