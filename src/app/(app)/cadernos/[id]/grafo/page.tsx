"use client";

import { useParams } from "next/navigation";

import { GraphView } from "@/components/feature/graph-view";
import { NotebookDetailShell } from "@/components/feature/notebook-detail-shell";

export default function NotebookGraphPage() {
  const params = useParams<{ id: string }>();
  const notebookId = params.id;

  return (
    <NotebookDetailShell>
      <div className="-mx-8 -my-6 flex h-[calc(100vh-18rem)] flex-col">
        <header className="border-b px-8 py-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Grafo do caderno
          </h2>
          <p className="text-muted-foreground text-sm">
            Vista local — só notas, tarefas e eventos deste caderno e suas tags.
          </p>
        </header>
        <div className="flex-1">
          <GraphView notebookId={notebookId} />
        </div>
      </div>
    </NotebookDetailShell>
  );
}
