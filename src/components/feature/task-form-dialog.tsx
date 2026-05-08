"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";

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
import { Input } from "@/components/ui/input/input";
import { Label } from "@/components/ui/label/label";
import { TagSelector } from "@/components/ui/tag-selector/tag-selector";
import { useToast } from "@/components/ui/toast/toast";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";
import { tagService } from "@/services/tag-service";
import {
  taskService,
  type TaskPriority,
} from "@/services/task-service";
import type { Tag } from "@/types/tag";

/**
 * Modal de criar/editar `StandaloneTask`. Usado pela página /tarefas e ao
 * clicar numa tarefa standalone na lista.
 *
 * Quando `parentId` é setado e há `taskId`, é edição; quando `parentId` é
 * setado mas não há `taskId`, é criação de sub-tarefa filha de `parentId`.
 */

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando definido, modal abre em modo edit. */
  taskId?: string | null;
  /** Pré-preenchido em modo create — cria como filha desta task. */
  defaultParentId?: string;
  /** Pré-preenchido em modo create — vincula a este caderno. */
  defaultNotebookId?: string;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];

export function TaskFormDialog({
  open,
  onOpenChange,
  taskId,
  defaultParentId,
  defaultNotebookId,
}: TaskFormDialogProps) {
  const { toast } = useToast();
  const titleFieldId = useId();
  const descId = useId();
  const dueDateId = useId();
  const priorityId = useId();
  const notebookFieldId = useId();
  const errorId = useId();

  const isEdit = !!taskId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [linkedNotebookId, setLinkedNotebookId] = useState("");
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    notebookService.list().then((all) => {
      setNotebooks(all.filter((n) => !n.hidden));
    });
    tagService.listAll().then(setTagSuggestions);
    if (taskId) {
      taskService.getStandalone(taskId).then((t) => {
        if (!t) {
          setError("Tarefa não encontrada.");
          return;
        }
        setTitle(t.title);
        setDescription(t.description ?? "");
        setDueDate(t.dueDate ?? "");
        setPriority(t.priority ?? "");
        setLinkedNotebookId(t.notebookId ?? "");
        setTags(t.tags ?? []);
      });
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("");
      setLinkedNotebookId(defaultNotebookId ?? "");
      setTags([]);
    }
  }, [open, taskId, defaultNotebookId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Informe o título da tarefa.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && taskId) {
        await taskService.updateStandalone(taskId, {
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || null,
          priority: priority || undefined,
          notebookId: linkedNotebookId || null,
          tags,
        });
        toast({ title: "Tarefa atualizada", variant: "success" });
      } else {
        await taskService.createStandalone({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          priority: priority || undefined,
          parentId: defaultParentId,
          notebookId: linkedNotebookId || undefined,
          tags,
        });
        toast({ title: "Tarefa criada", variant: "success" });
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!taskId) return;
    setDeleting(true);
    try {
      await taskService.deleteStandalone(taskId);
      toast({ title: "Tarefa excluída", variant: "success" });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Não foi possível excluir",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar tarefa" : "Nova tarefa"}
          </DialogTitle>
          <DialogDescription>
            Tarefas com hierarquia multi-nível. Pode ficar livre ou vinculada
            a um caderno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={titleFieldId} required>
              Título
            </Label>
            <Input
              id={titleFieldId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Resolver lista de exercícios"
              autoFocus
              required
              invalid={!!error && !title.trim()}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={descId}>Descrição</Label>
            <Input
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes opcionais"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={dueDateId}>Data limite</Label>
              <Input
                id={dueDateId}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={priorityId}>Prioridade</Label>
              <select
                id={priorityId}
                value={priority}
                onChange={(e) =>
                  setPriority((e.target.value as TaskPriority) || "")
                }
                className="border-border bg-bg focus-visible:ring-brand-300 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              >
                <option value="">—</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={notebookFieldId}>Caderno</Label>
            <select
              id={notebookFieldId}
              value={linkedNotebookId}
              onChange={(e) => setLinkedNotebookId(e.target.value)}
              className="border-border bg-bg focus-visible:ring-brand-300 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            >
              <option value="">— Nenhum (livre)</option>
              {notebooks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tags</Label>
            <TagSelector
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
            />
          </div>

          {error && (
            <p id={errorId} className="text-danger text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="!mt-4">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                loading={deleting}
                className="sm:mr-auto"
              >
                <Trash2 className="size-4" aria-hidden />
                {deleting ? "Excluindo…" : "Excluir"}
              </Button>
            )}
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" loading={loading}>
              {isEdit ? "Salvar" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
