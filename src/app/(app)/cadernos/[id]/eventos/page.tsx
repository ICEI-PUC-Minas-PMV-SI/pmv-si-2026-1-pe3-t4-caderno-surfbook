"use client";

import { Calendar } from "lucide-react";

import { NotebookDetailShell } from "@/components/feature/notebook-detail-shell";
import { EmptyState } from "@/components/ui/empty-state/empty-state";

export default function NotebookEventsPage() {
  return (
    <NotebookDetailShell>
      <EmptyState
        icon={<Calendar className="size-7" aria-hidden />}
        title="Eventos — em breve"
        description="A aba de Eventos vai conectar prazos do caderno ao calendário, ajudando a planejar revisões e entregas."
      />
    </NotebookDetailShell>
  );
}
