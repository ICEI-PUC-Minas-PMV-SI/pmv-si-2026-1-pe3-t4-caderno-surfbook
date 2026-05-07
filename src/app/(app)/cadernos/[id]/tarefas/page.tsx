"use client";

import { ListTodo } from "lucide-react";

import { NotebookDetailShell } from "@/components/feature/notebook-detail-shell";
import { EmptyState } from "@/components/ui/empty-state/empty-state";

export default function NotebookTasksPage() {
  return (
    <NotebookDetailShell>
      <EmptyState
        icon={<ListTodo className="size-7" aria-hidden />}
        title="Tarefas — em breve"
        description="A aba de Tarefas vai permitir organizar afazeres por caderno, com prazos e prioridades. Estamos trabalhando nisso."
      />
    </NotebookDetailShell>
  );
}
