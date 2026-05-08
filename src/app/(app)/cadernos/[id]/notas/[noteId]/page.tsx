"use client";

import {
  ArrowLeft,
  Copy,
  Link2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import { CompletionCheckbox } from "@/components/feature/completion-checkbox";
import { GraphView } from "@/components/feature/graph-view";
import { NoteEditor } from "@/components/feature/note-editor";
import { NoteOutline } from "@/components/feature/note-outline";
import { Button } from "@/components/ui/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state/empty-state";
import { TagSelector } from "@/components/ui/tag-selector/tag-selector";
import { useToast } from "@/components/ui/toast/toast";
import { nodesToMarkdown } from "@/lib/markdown-nodes";
import { buildShareUrl } from "@/lib/share";
import {
  noteService,
  type Note,
  type NoteNode,
} from "@/services/note-service";
import { notebookService, type Notebook } from "@/services/notebook-service";
import { tagService } from "@/services/tag-service";
import type { Tag } from "@/types/tag";

export default function NoteEditorPage() {
  const params = useParams<{ id: string; noteId: string }>();
  const notebookId = params.id;
  const noteId = params.noteId;
  const router = useRouter();
  const { toast } = useToast();
  const titleId = useId();

  const [note, setNote] = useState<Note | null | undefined>(undefined);
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [title, setTitle] = useState("");
  const [nodes, setNodes] = useState<NoteNode[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [dueDate, setDueDate] = useState<string>("");
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    Promise.all([
      noteService.get(noteId),
      notebookService.get(notebookId),
      tagService.listAll(),
    ]).then(([n, nb, suggestions]) => {
      setNote(n);
      setNotebook(nb);
      setTagSuggestions(suggestions);
      if (n) {
        setTitle(n.title);
        setNodes(n.nodes ?? []);
        setTags(n.tags ?? []);
        setDueDate(n.dueDate ?? "");
        setCompletedAt(n.completedAt ?? null);
      }
    });
  }, [noteId, notebookId]);

  // Hash-based scroll: ao chegar com #node-<id>, rola pro bloco depois que renderizar
  useEffect(() => {
    if (!note) return;
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#node-")) return;
    const id = hash.slice(1);
    const tid = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-brand-300");
        setTimeout(
          () => el.classList.remove("ring-2", "ring-brand-300"),
          1500
        );
      }
    }, 200);
    return () => clearTimeout(tid);
  }, [note]);

  const save = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!note || saving) return;
      setSaving(true);
      try {
        await noteService.update(note.id, {
          title,
          nodes,
          tags,
          dueDate: dueDate || null,
          completedAt,
        });
        setDirty(false);
        if (!opts.silent) {
          toast({ title: "Nota salva", variant: "success" });
        }
      } catch (err) {
        toast({
          title: "Não foi possível salvar",
          description: err instanceof Error ? err.message : undefined,
          variant: "danger",
        });
      } finally {
        setSaving(false);
      }
    },
    [note, saving, title, nodes, tags, dueDate, completedAt, toast]
  );

  // Cmd/Ctrl+S salva
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  // Auto-save: 2s após parar de digitar, salva silenciosamente. Cada nova
  // edição (re-criação de `save` por via dos deps title/nodes/tags) reseta
  // o timer — garantindo debounce real.
  useEffect(() => {
    if (!dirty || saving) return;
    const t = setTimeout(() => {
      save({ silent: true });
    }, 2000);
    return () => clearTimeout(t);
  }, [dirty, saving, save]);

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function handleDelete() {
    if (!note) return;
    setDeleting(true);
    try {
      await noteService.delete(note.id);
      toast({ title: "Nota excluída", variant: "success" });
      router.push(`/cadernos/${notebookId}`);
    } catch (err) {
      toast({
        title: "Não foi possível excluir",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
      setDeleting(false);
    }
  }

  async function handleExportMarkdown() {
    const md = nodesToMarkdown(nodes);
    try {
      await navigator.clipboard.writeText(md);
      toast({
        title: "Markdown copiado",
        description: "Cole onde quiser exportar a nota.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Tente exportar manualmente em outro navegador.",
        variant: "danger",
      });
    }
  }

  async function handleCopyShareLink() {
    if (!notebook || !note) return;
    const liveNote = { ...note, title, nodes, tags };
    try {
      const url = buildShareUrl(notebook, liveNote);
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado",
        description:
          "Qualquer pessoa com o link pode ler esta nota (snapshot atual).",
        variant: "success",
      });
    } catch {
      toast({
        title: "Não foi possível copiar o link",
        variant: "danger",
      });
    }
  }

  if (note === undefined) {
    return <p className="text-muted-foreground text-sm">Carregando…</p>;
  }

  if (note === null) {
    return (
      <EmptyState
        title="Nota não encontrada"
        description="Pode ter sido excluída ou você não tem acesso."
        action={
          <Button asChild>
            <Link href={`/cadernos/${notebookId}`}>Voltar para o caderno</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full gap-6">
      <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-5 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/cadernos/${notebookId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {notebook?.name ?? "Caderno"}
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="text-muted-foreground text-xs"
            aria-live="polite"
          >
            {saving ? "Salvando…" : dirty ? "Não salvo" : "Salvo"}
          </span>
          <Button onClick={() => save()} loading={saving} disabled={!dirty} size="sm">
            Salvar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mais opções"
              >
                <MoreVertical className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleCopyShareLink}>
                <Link2 className="size-4" aria-hidden />
                Copiar link compartilhável
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportMarkdown}>
                <Copy className="size-4" aria-hidden />
                Exportar como Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Excluir nota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => markDirty(setTitle)(e.target.value)}
          placeholder="Sem título"
          className="font-display placeholder:text-muted-foreground/40 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none"
          aria-label="Título da nota"
        />
        <TagSelector
          value={tags}
          onChange={markDirty(setTags)}
          suggestions={tagSuggestions}
        />
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <label htmlFor="note-due-date" className="shrink-0">
            Data limite:
          </label>
          <input
            id="note-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => markDirty(setDueDate)(e.target.value)}
            className="bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-brand-300 rounded px-1 py-0.5"
          />
          {dueDate && (
            <button
              type="button"
              onClick={() => markDirty(setDueDate)("")}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              Remover
            </button>
          )}
        </div>
        {dueDate && (
          <CompletionCheckbox
            completedAt={completedAt}
            onChange={(v) => markDirty(setCompletedAt)(v)}
          />
        )}
      </div>

      <div className="flex-1">
        <NoteEditor nodes={nodes} onChange={markDirty(setNodes)} />
      </div>
      </div>

      <aside className="hidden w-72 shrink-0 flex-col gap-6 overflow-y-auto lg:flex">
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
            Grafo local
          </h3>
          <div className="bg-surface flex h-[28rem] flex-col overflow-hidden rounded-lg border">
            <GraphView notebookId={notebookId} panelPlacement="below" />
          </div>
        </section>
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
            Outline
          </h3>
          <NoteOutline nodes={nodes} />
        </section>
      </aside>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir esta nota?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={deleting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              <Trash2 className="size-4" aria-hidden />
              {deleting ? "Excluindo…" : "Sim, excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
