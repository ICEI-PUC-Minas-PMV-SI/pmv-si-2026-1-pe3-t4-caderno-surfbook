"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

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
import { useToast } from "@/components/ui/toast/toast";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

interface DeleteNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebook: Notebook;
  onSuccess?: () => void;
}

export function DeleteNotebookDialog({
  open,
  onOpenChange,
  notebook,
  onSuccess,
}: DeleteNotebookDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await notebookService.delete(notebook.id);
      toast({
        title: "Caderno excluído",
        description: `“${notebook.name}” foi removido.`,
        variant: "success",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Não foi possível excluir",
        description:
          err instanceof Error ? err.message : "Tente novamente.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir &ldquo;{notebook.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Todas as notas dentro do caderno
            também serão excluídas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={loading}
          >
            <Trash2 className="size-4" aria-hidden />
            {loading ? "Excluindo…" : "Sim, excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
