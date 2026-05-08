"use client";

import {
  ArrowDownAZ,
  ArrowUpDown,
  ChevronDown,
  Clock,
  FileDown,
  FileText,
  ListOrdered,
  Plus,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ImportMarkdownDialog } from "@/components/feature/import-markdown-dialog";
import { NotebookDetailShell } from "@/components/feature/notebook-detail-shell";
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
import { useToast } from "@/components/ui/toast/toast";
import { getSavedSort, saveSort, type SortOption } from "@/lib/notes-sort";
import { noteService, type Note } from "@/services/note-service";

const SORT_LABELS: Record<
  SortOption,
  { label: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }
> = {
  updated: { label: "Atualização recente", icon: Clock },
  created: { label: "Criação recente", icon: ArrowUpDown },
  position: { label: "Ordem manual", icon: ListOrdered },
  title: { label: "Título A→Z", icon: ArrowDownAZ },
};

function sortNotes(notes: Note[], by: SortOption): Note[] {
  const copy = [...notes];
  switch (by) {
    case "updated":
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "created":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "position":
      return copy.sort((a, b) => a.position - b.position);
    case "title":
      return copy.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "pt-BR", {
          sensitivity: "base",
        })
      );
  }
}

export default function NotebookNotesPage() {
  const params = useParams<{ id: string }>();
  const notebookId = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sortBy, setSortByState] = useState<SortOption>("updated");

  // Carrega preferência salva sempre que troca de caderno
  useEffect(() => {
    const saved = getSavedSort(notebookId);
    if (saved) setSortByState(saved);
    else setSortByState("updated");
  }, [notebookId]);

  function setSortBy(opt: SortOption) {
    setSortByState(opt);
    saveSort(notebookId, opt);
  }

  const reload = useCallback(() => {
    noteService.listByNotebook(notebookId).then(setNotes);
  }, [notebookId]);

  useEffect(() => {
    reload();
    const offIns = noteService.on("inserted", (note) => {
      if (note.notebookId === notebookId) reload();
    });
    const offDel = noteService.on("removed", (note) => {
      if (note.notebookId === notebookId) reload();
    });
    const offUpd = noteService.on("updated", ({ new: note }) => {
      if (note.notebookId === notebookId) reload();
    });
    return () => {
      offIns();
      offDel();
      offUpd();
    };
  }, [notebookId, reload]);

  const sorted = useMemo(
    () => (notes ? sortNotes(notes, sortBy) : null),
    [notes, sortBy]
  );

  async function handleCreateNote() {
    setCreating(true);
    try {
      const note = await noteService.create({ notebookId });
      router.push(`/cadernos/${notebookId}/notas/${note.id}`);
    } catch (err) {
      toast({
        title: "Não foi possível criar a nota",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
      setCreating(false);
    }
  }

  const SortIcon = SORT_LABELS[sortBy].icon;

  return (
    <NotebookDetailShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
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
                    {opt === sortBy && (
                      <span className="text-muted-foreground ml-auto text-[10px]">
                        atual
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button
              onClick={handleCreateNote}
              loading={creating}
              size="sm"
              className="rounded-r-none"
            >
              <Plus className="size-4" aria-hidden />
              Nova nota
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  aria-label="Mais opções de criação"
                  className="rounded-l-none border-l border-l-white/20 px-2"
                >
                  <ChevronDown className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleCreateNote}>
                  <Plus className="size-4" aria-hidden />
                  Em branco
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setImporting(true)}>
                  <FileDown className="size-4" aria-hidden />
                  Importar de Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {sorted === null && (
          <p className="text-muted-foreground text-sm">Carregando…</p>
        )}

        {sorted?.length === 0 && (
          <EmptyState
            icon={<FileText className="size-7" aria-hidden />}
            title="Nenhuma nota neste caderno"
            description="Crie sua primeira nota para começar a registrar o que está estudando, ou importe um Markdown existente."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={handleCreateNote} loading={creating}>
                  <Plus className="size-4" aria-hidden />
                  Criar primeira nota
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setImporting(true)}
                >
                  <FileDown className="size-4" aria-hidden />
                  Importar Markdown
                </Button>
              </div>
            }
          />
        )}

        {sorted && sorted.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sorted.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                notebookId={notebookId}
              />
            ))}
          </div>
        )}
      </div>

      <ImportMarkdownDialog
        open={importing}
        onOpenChange={setImporting}
        notebookId={notebookId}
        onCreated={(noteId) => {
          router.push(`/cadernos/${notebookId}/notas/${noteId}`);
        }}
      />
    </NotebookDetailShell>
  );
}
