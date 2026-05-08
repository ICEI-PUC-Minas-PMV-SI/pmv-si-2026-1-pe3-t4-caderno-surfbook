"use client";

import {
  ArrowDownAZ,
  ArrowUpDown,
  ChevronDown,
  Clock,
  FileText,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NoteListItem } from "@/components/feature/note-list-item";
import { Button } from "@/components/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state/empty-state";
import { noteService, type Note } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

type SortOption = "updated" | "created" | "title";

const SORT_LABELS: Record<
  SortOption,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }
> = {
  updated: { label: "Atualização recente", icon: Clock },
  created: { label: "Criação recente", icon: ArrowUpDown },
  title: { label: "Título A→Z", icon: ArrowDownAZ },
};

function sortNotes(notes: Note[], by: SortOption): Note[] {
  const copy = [...notes];
  switch (by) {
    case "updated":
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "created":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "title":
      return copy.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "pt-BR", {
          sensitivity: "base",
        })
      );
  }
}

export default function GlobalNotesPage() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("updated");

  const reload = useCallback(() => {
    Promise.all([noteService.listAll(), notebookService.list()]).then(
      ([ns, nbs]) => {
        setNotes(ns);
        setNotebooks(nbs);
      }
    );
  }, []);

  useEffect(() => {
    reload();
    const offIns = noteService.on("inserted", reload);
    const offDel = noteService.on("removed", reload);
    const offUpd = noteService.on("updated", reload);
    return () => {
      offIns();
      offDel();
      offUpd();
    };
  }, [reload]);

  const sorted = useMemo(
    () => (notes ? sortNotes(notes, sortBy) : null),
    [notes, sortBy]
  );

  const notebookById = useMemo(
    () => new Map(notebooks.map((n) => [n.id, n])),
    [notebooks]
  );

  const SortIcon = SORT_LABELS[sortBy].icon;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Todas as notas
        </h1>
        <p className="text-muted-foreground">
          Visão consolidada das suas notas em todos os cadernos.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <SortIcon className="size-4" aria-hidden />
              {SORT_LABELS[sortBy].label}
              <ChevronDown className="size-3 opacity-60" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => {
              const Icon = SORT_LABELS[opt].icon;
              return (
                <DropdownMenuItem
                  key={opt}
                  onSelect={() => setSortBy(opt)}
                  disabled={opt === sortBy}
                >
                  <Icon className="size-4" aria-hidden />
                  {SORT_LABELS[opt].label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {sorted && sorted.length > 0 && (
          <span className="text-muted-foreground text-sm">
            {sorted.length} {sorted.length === 1 ? "nota" : "notas"}
          </span>
        )}
      </div>

      {sorted === null && (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      )}

      {sorted?.length === 0 && (
        <EmptyState
          icon={<FileText className="size-7" aria-hidden />}
          title="Nenhuma nota ainda"
          description="Suas notas de qualquer caderno aparecerão aqui. Vá pra um caderno e crie a primeira."
        />
      )}

      {sorted && sorted.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              notebookId={note.notebookId}
              notebook={notebookById.get(note.notebookId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
