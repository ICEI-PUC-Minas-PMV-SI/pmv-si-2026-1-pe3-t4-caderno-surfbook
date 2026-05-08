"use client";

import { useRouter } from "next/navigation";

import {
  NotebookForm,
  toCreateInput,
  type NotebookFormValues,
} from "@/components/feature/notebook-form";
import { useToast } from "@/components/ui/toast/toast";
import { notebookService } from "@/services/notebook-service";

export default function NovoCadernoPage() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(values: NotebookFormValues) {
    const created = await notebookService.create(toCreateInput(values));
    toast({
      title: "Caderno criado",
      description: `“${created.name}” está disponível em Cadernos.`,
      variant: "success",
    });
    router.replace("/cadernos");
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Novo caderno
        </h1>
        <p className="text-muted-foreground text-sm">
          Dê um nome, escolha ícone, capa e tags — todos opcionais exceto o nome.
        </p>
      </header>

      <div className="bg-surface rounded-lg border p-6 shadow-sm">
        <NotebookForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
