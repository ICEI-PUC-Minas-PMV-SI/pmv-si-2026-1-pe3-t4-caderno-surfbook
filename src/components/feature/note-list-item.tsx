"use client";

import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteNoteDialog } from "@/components/feature/delete-note-dialog";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
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
  /** Disparado após exclusão concluída (atualiza a lista). */
  onUpdate?: () => void;
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

export function NoteListItem({
  note,
  notebookId,
  notebook,
  onUpdate,
}: NoteListItemProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const title = note.title.trim() || "Sem título";
  const preview = nodesToSnippet(note.nodes ?? []);
  const NotebookIcon = notebook ? getIconComponent(notebook.iconName) : null;

  const editHref = `/cadernos/${notebookId}/notas/${note.id}`;

  return (
    <>
      <div className="group relative">
        <Link
          href={editHref}
          className={cn(
            "bg-surface flex flex-col gap-1.5 rounded-lg border p-4 transition-colors",
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
          <h3
            className={cn(
              "font-display pr-8 text-base font-semibold leading-tight",
              !note.title.trim() && "text-muted-foreground italic"
            )}
          >
            {title}
          </h3>
          {preview && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {preview}
            </p>
          )}
          <div className="mt-1 flex items-end justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <Badge key={tag.id} color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
            </div>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatRelativeDate(note.updatedAt)}
            </span>
          </div>
        </Link>

        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Mais opções de ${title}`}
                className="size-7 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push(editHref)}>
                <Edit3 className="size-4" aria-hidden />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteNoteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        note={note}
        onSuccess={onUpdate}
      />
    </>
  );
}
