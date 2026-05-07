"use client";

import {
  ArrowLeft,
  Calendar,
  FileText,
  ListTodo,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DeleteNotebookDialog } from "@/components/feature/delete-notebook-dialog";
import { EditNotebookDialog } from "@/components/feature/edit-notebook-dialog";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state/empty-state";
import { Tabs, TabsContent } from "@/components/ui/tabs/tabs";
import { getIconComponent } from "@/lib/icons";
import { noteService } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

interface NotebookDetailShellProps {
  children: React.ReactNode;
}

/**
 * Shell compartilhado pelas páginas de um caderno (notas / tarefas / eventos).
 * Renderiza:
 * - Back link
 * - Cover banner (se houver)
 * - Header (ícone, nome, descrição, tags, ações)
 * - Tabs estilo pasta de arquivos
 * - Slot do conteúdo da aba ativa via TabsContent
 *
 * Cada página de aba (notas/page.tsx, tarefas/page.tsx, etc.) embrulha seu
 * conteúdo neste shell. Editor de nota individual NÃO usa este shell — ele
 * tem layout próprio focado em escrita.
 */
export function NotebookDetailShell({ children }: NotebookDetailShellProps) {
  const params = useParams<{ id: string }>();
  const notebookId = params.id;
  const router = useRouter();

  const [notebook, setNotebook] = useState<Notebook | null | undefined>(
    undefined
  );
  const [noteCount, setNoteCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadNotebook = useCallback(async () => {
    const nb = await notebookService.get(notebookId);
    setNotebook(nb);
  }, [notebookId]);

  const loadCounts = useCallback(async () => {
    const notes = await noteService.listByNotebook(notebookId);
    setNoteCount(notes.length);
  }, [notebookId]);

  // Carregamento inicial + listeners reativos via event system
  useEffect(() => {
    loadNotebook();
    loadCounts();

    const offNbUpdate = notebookService.on("updated", ({ new: nb }) => {
      if (nb.id === notebookId) setNotebook(nb);
    });
    const offNoteIns = noteService.on("inserted", (note) => {
      if (note.notebookId === notebookId) loadCounts();
    });
    const offNoteDel = noteService.on("removed", (note) => {
      if (note.notebookId === notebookId) loadCounts();
    });

    return () => {
      offNbUpdate();
      offNoteIns();
      offNoteDel();
    };
  }, [notebookId, loadNotebook, loadCounts]);

  if (notebook === undefined) {
    return <p className="text-muted-foreground text-sm">Carregando…</p>;
  }

  if (notebook === null) {
    return (
      <div className="space-y-3">
        <Link
          href="/cadernos"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Cadernos
        </Link>
        <EmptyState
          title="Caderno não encontrado"
          description="Pode ter sido excluído ou você não tem acesso."
          action={
            <Button asChild>
              <Link href="/cadernos">Voltar para cadernos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const Icon = getIconComponent(notebook.iconName);

  const tabs = [
    {
      href: `/cadernos/${notebookId}/notas`,
      label: "Notas",
      count: noteCount,
      icon: FileText,
    },
    {
      href: `/cadernos/${notebookId}/tarefas`,
      label: "Tarefas",
      icon: ListTodo,
      disabled: true,
      hint: "em breve",
    },
    {
      href: `/cadernos/${notebookId}/eventos`,
      label: "Eventos",
      icon: Calendar,
      disabled: true,
      hint: "em breve",
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/cadernos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Cadernos
      </Link>

      {notebook.coverUrl && (
        <div className="bg-muted h-40 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={notebook.coverUrl}
            alt={`Capa do caderno ${notebook.name}`}
            className="size-full object-cover"
          />
        </div>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          {Icon && (
            <div className="bg-brand-100 text-brand-700 flex size-12 shrink-0 items-center justify-center rounded">
              <Icon className="size-6" aria-hidden />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {notebook.name}
              </h1>
              {notebook.system && <Badge variant="brand">Tutorial</Badge>}
            </div>
            {notebook.description && (
              <p className="text-muted-foreground">{notebook.description}</p>
            )}
            {notebook.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {notebook.tags.map((tag) => (
                  <Badge key={tag.id} color={tag.color}>
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ações do caderno"
            >
              <MoreVertical className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              Editar caderno
            </DropdownMenuItem>
            {!notebook.system && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(true)}
                >
                  Excluir caderno
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div>
        <Tabs tabs={tabs} />
        <TabsContent>{children}</TabsContent>
      </div>

      <EditNotebookDialog
        open={editing}
        onOpenChange={setEditing}
        notebook={notebook}
        onSuccess={loadNotebook}
      />
      <DeleteNotebookDialog
        open={deleting}
        onOpenChange={setDeleting}
        notebook={notebook}
        onSuccess={() => router.push("/cadernos")}
      />
    </div>
  );
}
