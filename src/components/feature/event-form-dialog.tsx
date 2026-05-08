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
  eventService,
  type EventPriority,
} from "@/services/event-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";
import { tagService } from "@/services/tag-service";
import type { Tag } from "@/types/tag";

/**
 * Modal pra criar/editar `StandaloneEvent`. Usado nas páginas de calendário
 * (global e por caderno) e ao clicar num chip de evento standalone no
 * MonthCalendar.
 *
 * Modo controlado: pai tem `open`, `onOpenChange`, e opcionalmente:
 * - `eventId` → modo edit, busca pelo id
 * - `defaultNotebookId` → modo create com caderno pré-selecionado
 */

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando definido, modal abre em modo edit. */
  eventId?: string | null;
  /** Pré-selecionado em modo create; ignorado em edit. */
  defaultNotebookId?: string;
}

const PRIORITIES: { value: EventPriority; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];

export function EventFormDialog({
  open,
  onOpenChange,
  eventId,
  defaultNotebookId,
}: EventFormDialogProps) {
  const { toast } = useToast();
  const nameId = useId();
  const descId = useId();
  const startId = useId();
  const endId = useId();
  const priorityId = useId();
  const notebookId = useId();
  const errorId = useId();

  const isEdit = !!eventId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState<EventPriority | "">("");
  const [linkedNotebookId, setLinkedNotebookId] = useState("");
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hidrata ao abrir, limpa ao fechar
  useEffect(() => {
    if (!open) return;
    setError(null);
    notebookService.list().then((all) => {
      setNotebooks(all.filter((n) => !n.hidden));
    });
    tagService.listAll().then(setTagSuggestions);
    if (eventId) {
      eventService.getStandalone(eventId).then((ev) => {
        if (!ev) {
          setError("Evento não encontrado.");
          return;
        }
        setName(ev.name);
        setDescription(ev.description ?? "");
        setStartDate(ev.startDate);
        setEndDate(ev.endDate);
        setPriority(ev.priority ?? "");
        setLinkedNotebookId(ev.notebookId ?? "");
        setCompletedAt(ev.completedAt ?? null);
        setTags(ev.tags ?? []);
      });
    } else {
      setName("");
      setDescription("");
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
      setPriority("");
      setLinkedNotebookId(defaultNotebookId ?? "");
      setCompletedAt(null);
      setTags([]);
    }
  }, [open, eventId, defaultNotebookId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe um nome para o evento.");
      return;
    }
    if (!startDate) {
      setError("Informe a data de início.");
      return;
    }
    if (endDate && endDate < startDate) {
      setError("A data final não pode ser anterior à inicial.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && eventId) {
        await eventService.updateStandalone(eventId, {
          name: name.trim(),
          description: description.trim(),
          startDate,
          endDate: endDate || startDate,
          priority: priority || undefined,
          notebookId: linkedNotebookId || null,
          completedAt,
          tags,
        });
        toast({ title: "Evento atualizado", variant: "success" });
      } else {
        await eventService.createStandalone({
          name: name.trim(),
          description: description.trim() || undefined,
          startDate,
          endDate: endDate || startDate,
          priority: priority || undefined,
          notebookId: linkedNotebookId || undefined,
          tags,
        });
        toast({ title: "Evento criado", variant: "success" });
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar evento.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    setDeleting(true);
    try {
      await eventService.deleteStandalone(eventId);
      toast({ title: "Evento excluído", variant: "success" });
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
          <DialogTitle>{isEdit ? "Editar evento" : "Novo evento"}</DialogTitle>
          <DialogDescription>
            Lembrete pessoal do calendário. Pode ser vinculado a um caderno ou
            ficar livre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isEdit && (
            <label className="bg-muted/40 hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded p-2 transition-colors">
              <input
                type="checkbox"
                checked={!!completedAt}
                onChange={(e) =>
                  setCompletedAt(
                    e.target.checked ? new Date().toISOString() : null
                  )
                }
                className="border-border accent-brand-500 size-4 rounded"
              />
              <span className="text-sm">
                {completedAt ? (
                  <>
                    Cumprido em{" "}
                    <strong>
                      {new Date(completedAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </>
                ) : (
                  "Marcar como cumprido"
                )}
              </span>
            </label>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nameId} required>
              Nome
            </Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Prova de cálculo"
              autoFocus
              required
              invalid={!!error && !name.trim()}
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
              <Label htmlFor={startId} required>
                Data
              </Label>
              <Input
                id={startId}
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={endId}>Até (opcional)</Label>
              <Input
                id={endId}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={priorityId}>Prioridade</Label>
              <select
                id={priorityId}
                value={priority}
                onChange={(e) =>
                  setPriority((e.target.value as EventPriority) || "")
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={notebookId}>Caderno</Label>
              <select
                id={notebookId}
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
              {isEdit ? "Salvar" : "Criar evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
