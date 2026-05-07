"use client";

import {
  NotebookForm,
  toUpdateInput,
  type NotebookFormValues,
} from "@/components/feature/notebook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";
import { useToast } from "@/components/ui/toast/toast";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

interface EditNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebook: Notebook;
  onSuccess?: () => void;
}

export function EditNotebookDialog({
  open,
  onOpenChange,
  notebook,
  onSuccess,
}: EditNotebookDialogProps) {
  const { toast } = useToast();

  async function handleSubmit(values: NotebookFormValues) {
    const updated = await notebookService.update(
      notebook.id,
      toUpdateInput(values)
    );
    toast({
      title: "Caderno atualizado",
      description: `“${updated.name}” foi atualizado.`,
      variant: "success",
    });
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar caderno</DialogTitle>
          <DialogDescription>
            Atualize nome, ícone, capa, tags e descrição.
          </DialogDescription>
        </DialogHeader>
        <NotebookForm
          initial={notebook}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
