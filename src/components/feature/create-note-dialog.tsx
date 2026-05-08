"use client";

import { useRouter } from "next/navigation";
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
import { useToast } from "@/components/ui/toast/toast";
import { noteService } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

/**
 * Diálogo "Criar nota" do `+ Novo` global. Como nota requer caderno, pede
 * que o usuário escolha antes de criar. Após criar, navega direto pra página
 * de edição.
 */

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
}: CreateNoteDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const titleFieldId = useId();
  const notebookFieldId = useId();
  const errorId = useId();

  const [title, setTitle] = useState("");
  const [notebookId, setNotebookId] = useState("");
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle("");
    notebookService.list().then((all) => {
      const visible = all.filter((n) => !n.hidden);
      setNotebooks(visible);
      // Pré-seleciona o primeiro caderno visível pra agilizar
      if (visible.length > 0) {
        setNotebookId(visible[0].id);
      }
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!notebookId) {
      setError("Escolha um caderno.");
      return;
    }
    setLoading(true);
    try {
      const note = await noteService.create({
        notebookId,
        title: title.trim() || undefined,
      });
      onOpenChange(false);
      router.push(`/cadernos/${notebookId}/notas/${note.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar nota.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova nota</DialogTitle>
          <DialogDescription>
            Escolha o caderno onde a nota vai morar. Você pode mudar o título
            depois.
          </DialogDescription>
        </DialogHeader>

        {notebooks.length === 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              Você ainda não tem nenhum caderno. Crie um primeiro.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push("/cadernos/novo");
                }}
              >
                Criar caderno
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={notebookFieldId} required>
                Caderno
              </Label>
              <select
                id={notebookFieldId}
                value={notebookId}
                onChange={(e) => setNotebookId(e.target.value)}
                className="border-border bg-bg focus-visible:ring-brand-300 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                required
              >
                {notebooks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={titleFieldId}>Título (opcional)</Label>
              <Input
                id={titleFieldId}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sem título"
                autoFocus
                aria-describedby={error ? errorId : undefined}
              />
            </div>

            {error && (
              <p id={errorId} className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={loading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" loading={loading}>
                Criar e abrir
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
