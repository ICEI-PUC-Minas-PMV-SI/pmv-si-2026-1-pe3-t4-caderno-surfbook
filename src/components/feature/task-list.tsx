"use client";

import {
  BookOpen,
  CalendarClock,
  CornerDownRight,
  FileText,
  ListTodo,
  MoreVertical,
  Plus,
} from "lucide-react";
import { useState } from "react";

import { TaskFormDialog } from "@/components/feature/task-form-dialog";
import { usePeek } from "@/components/feature/peek-provider";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import { parseInline } from "@/lib/inline-markdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import { useToast } from "@/components/ui/toast/toast";
import { cn } from "@/lib/utils";
import { taskService, type TaskItem } from "@/services/task-service";

/**
 * Renderiza um array de `TaskItem[]` como **árvore visual**:
 * - Roots (sem parent ou com parent fora do conjunto) na ordem por dueDate
 *   ascendente, depois sem-data; standalone respeita a position interna
 * - Filhos visivelmente indentados via `level * 1.5rem`
 *
 * Cada linha tem:
 * - Checkbox: toggle de conclusão (funciona pra qualquer parentType)
 * - Título: click → edit (standalone) ou peek (notebook/note)
 * - Badges: prioridade, dueDate, caderno
 * - Hover: + sub-tarefa, ⋮ (Editar/Excluir — só pra standalone)
 *
 * Tarefas concluídas vão pro fim, riscadas e dimmed.
 */

interface TaskListProps {
  items: TaskItem[];
  /** Caderno opcional pra pré-preencher no quick-add. */
  notebookContext?: string;
}

const PRIORITY_LABELS: Record<NonNullable<TaskItem["priority"]>, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const PRIORITY_COLORS: Record<NonNullable<TaskItem["priority"]>, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-700",
};

function formatRelative(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff < -1) return `${-diff}d atrás`;
  if (diff > 1 && diff <= 7) return `em ${diff} dias`;
  return target.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function rootSortKey(t: TaskItem): string {
  // Datas próximas primeiro; sem data → final do range
  return t.dueDate || "9999-99-99";
}

/** Remove separadores sem filhos visíveis no flat tree atual. */
function pruneEmptySeparators(flat: TaskItem[]): TaskItem[] {
  const out: TaskItem[] = [];
  for (let i = 0; i < flat.length; i++) {
    const item = flat[i];
    if (item.isSeparator) {
      let hasChild = false;
      for (let j = i + 1; j < flat.length; j++) {
        if (flat[j].level <= item.level) break;
        hasChild = true;
        break;
      }
      if (!hasChild) continue;
    }
    out.push(item);
  }
  return out;
}

function buildTree(items: TaskItem[]): TaskItem[] {
  const childrenOf = new Map<string | undefined, TaskItem[]>();
  const idsInSet = new Set(items.map((i) => i.id));
  for (const item of items) {
    // Parent fora do conjunto vira root (ex.: caderno completed numa seção
    // diferente da do filho pendente). Isso garante que o filho ainda aparece.
    const effectiveParent =
      item.parentId && idsInSet.has(item.parentId) ? item.parentId : undefined;
    const list = childrenOf.get(effectiveParent) ?? [];
    list.push(item);
    childrenOf.set(effectiveParent, list);
  }
  // Sort de irmãos: standalone com posição preserva; resto por dueDate asc.
  for (const list of childrenOf.values()) {
    list.sort((a, b) => {
      // Cadernos primeiro entre roots (separadores especialmente — agrupam)
      if (a.parentType === "notebook" && b.parentType !== "notebook") return -1;
      if (b.parentType === "notebook" && a.parentType !== "notebook") return 1;
      const k = rootSortKey(a).localeCompare(rootSortKey(b));
      if (k !== 0) return k;
      return a.position - b.position;
    });
  }
  // DFS — level é relativo à raiz visual (não ao level salvo)
  const out: TaskItem[] = [];
  function visit(parentId: string | undefined, level: number) {
    const kids = childrenOf.get(parentId) ?? [];
    for (const k of kids) {
      out.push({ ...k, level });
      visit(k.id, level + 1);
    }
  }
  visit(undefined, 0);
  return out;
}

export function TaskList({ items, notebookContext }: TaskListProps) {
  const peek = usePeek();
  const { toast } = useToast();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [creatingChildOf, setCreatingChildOf] = useState<string | null>(null);
  const [creatingForNotebook, setCreatingForNotebook] = useState<string | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const pending = items.filter((t) => !t.completedAt);
  const completed = items.filter((t) => t.completedAt);

  const pendingTree = pruneEmptySeparators(buildTree(pending));
  const completedTree = pruneEmptySeparators(buildTree(completed));

  async function toggle(item: TaskItem) {
    try {
      await taskService.toggleCompleted(item);
    } catch (err) {
      toast({
        title: "Falha ao atualizar",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    }
  }

  function openEdit(item: TaskItem) {
    if (item.isSeparator && item.parentType !== "note") {
      // Caderno separador: sem detalhe; nota separadora abre a nota
      return;
    }
    if (item.parentType === "task") {
      setEditingTaskId(item.sourceId);
      setCreatingChildOf(null);
      setCreatingForNotebook(null);
      setDialogOpen(true);
    } else if (item.parentType === "notebook") {
      peek.openNotebookPeek(item.sourceId);
    } else if (item.parentType === "note") {
      peek.openNotePeek(item.sourceId);
    } else if (item.parentType === "event") {
      peek.openEventPeek(item.sourceId);
    } else if (item.parentType === "checklist-item" && item.noteId) {
      // Click no item de checklist abre o peek da nota — pra editar o texto
      // do item, vai pra nota
      peek.openNotePeek(item.noteId);
    }
  }

  function openCreateChild(parentTaskId?: string, notebookId?: string) {
    setCreatingChildOf(parentTaskId ?? null);
    setCreatingForNotebook(notebookId ?? null);
    setEditingTaskId(null);
    setDialogOpen(true);
  }

  async function deleteTask(item: TaskItem) {
    if (item.parentType !== "task") return;
    try {
      await taskService.deleteStandalone(item.sourceId);
      toast({ title: "Tarefa excluída", variant: "success" });
    } catch (err) {
      toast({
        title: "Falha ao excluir",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    }
  }

  return (
    <div className="space-y-6">
      {pending.length === 0 && completed.length === 0 ? (
        <div className="text-muted-foreground bg-surface flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
          <ListTodo className="size-8 opacity-40" aria-hidden />
          <p className="text-sm">Nenhuma tarefa ainda.</p>
          <p className="text-xs">
            Tudo com <strong>data limite</strong> aparece aqui — caderno, nota
            ou tarefa avulsa.
          </p>
        </div>
      ) : (
        <>
          {pendingTree.length > 0 && (
            <section>
              <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Pendentes ({pending.length})
              </h3>
              <ul className="bg-surface divide-y rounded-lg border">
                {pendingTree.map((item) => (
                  <TaskRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggle(item)}
                    onOpen={() => openEdit(item)}
                    onAddChild={
                      // Permite criar sub-tarefa em qualquer caderno (separador ou
                      // task) e em qualquer task standalone.
                      item.parentType === "task"
                        ? () => openCreateChild(item.sourceId, undefined)
                        : item.parentType === "notebook"
                          ? () => openCreateChild(undefined, item.sourceId)
                          : undefined
                    }
                    onDelete={
                      item.parentType === "task"
                        ? () => deleteTask(item)
                        : undefined
                    }
                  />
                ))}
              </ul>
            </section>
          )}

          {completedTree.length > 0 && (
            <section>
              <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Concluídas ({completed.length})
              </h3>
              <ul className="bg-surface/60 divide-y rounded-lg border">
                {completedTree.map((item) => (
                  <TaskRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggle(item)}
                    onOpen={() => openEdit(item)}
                    onDelete={
                      item.parentType === "task"
                        ? () => deleteTask(item)
                        : undefined
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditingTaskId(null);
            setCreatingChildOf(null);
            setCreatingForNotebook(null);
          }
        }}
        taskId={editingTaskId}
        defaultParentId={creatingChildOf ?? undefined}
        defaultNotebookId={
          creatingForNotebook ?? notebookContext ?? undefined
        }
      />
    </div>
  );
}

interface TaskRowProps {
  item: TaskItem;
  onToggle: () => void;
  onOpen: () => void;
  onAddChild?: () => void;
  onDelete?: () => void;
}

function TaskRow({ item, onToggle, onOpen, onAddChild, onDelete }: TaskRowProps) {
  const isCompleted = !!item.completedAt;
  const indent = `${0.75 + item.level * 1.5}rem`;

  // Separador: caderno sem dueDate que agrupa filhos. Sem checkbox, sem toggle.
  if (item.isSeparator) {
    const SepIcon = item.parentType === "note" ? FileText : BookOpen;
    return (
      <li
        className="bg-muted/30 group flex items-center gap-2 px-3 py-1.5"
        style={{ paddingLeft: indent }}
      >
        <SepIcon
          className="text-muted-foreground size-3.5 shrink-0"
          aria-hidden
        />
        <button
          type="button"
          onClick={onOpen}
          className="text-muted-foreground flex-1 truncate text-left text-xs font-medium uppercase tracking-wide hover:text-foreground"
        >
          {parseInline(item.title)}
        </button>
        {onAddChild && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddChild}
            aria-label={`Adicionar tarefa em ${item.title}`}
            className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Plus className="size-3.5" aria-hidden />
          </Button>
        )}
      </li>
    );
  }

  return (
    <li
      className="group flex items-start gap-2 px-3 py-2"
      style={{ paddingLeft: indent }}
    >
      {item.level > 0 && (
        <CornerDownRight
          className="text-muted-foreground/50 mt-1 size-3 shrink-0"
          aria-hidden
        />
      )}
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={onToggle}
        aria-label={`Marcar “${item.title}” como ${isCompleted ? "pendente" : "concluída"}`}
        className="border-border accent-brand-500 mt-1 size-4 shrink-0 rounded"
      />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
      >
        <span
          className={cn(
            "truncate text-sm",
            isCompleted && "text-muted-foreground line-through"
          )}
        >
          {parseInline(item.title)}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {item.parentType !== "task" && item.parentType !== "checklist-item" && (
            <span className="text-muted-foreground inline-flex items-center gap-0.5">
              {item.parentType === "notebook" ? (
                <BookOpen className="size-2.5" aria-hidden />
              ) : item.parentType === "note" ? (
                <FileText className="size-2.5" aria-hidden />
              ) : (
                <CalendarClock className="size-2.5" aria-hidden />
              )}
              {item.parentType === "notebook"
                ? "Caderno"
                : item.parentType === "note"
                  ? "Nota"
                  : "Evento"}
            </span>
          )}
          {item.dueDate && (
            <span className="bg-amber-100 text-amber-800 inline-flex items-center gap-0.5 rounded px-1 py-0.5">
              <CalendarClock className="size-2.5" aria-hidden />
              {formatRelative(item.dueDate)}
            </span>
          )}
          {item.priority && (
            <span
              className={cn(
                "inline-flex items-center rounded px-1 py-0.5",
                PRIORITY_COLORS[item.priority]
              )}
            >
              {PRIORITY_LABELS[item.priority]}
            </span>
          )}
          {item.tags?.map((tag) => (
            <Badge
              key={tag.id}
              color={tag.color}
              className="text-[10px]"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onAddChild && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddChild}
            aria-label="Adicionar sub-tarefa"
            className="size-7"
          >
            <Plus className="size-3.5" aria-hidden />
          </Button>
        )}
        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mais opções"
                className="size-7"
              >
                <MoreVertical className="size-3.5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onOpen}>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
}
