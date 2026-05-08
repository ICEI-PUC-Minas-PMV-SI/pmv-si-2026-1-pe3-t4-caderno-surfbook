"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { NotebookDetailShell } from "@/components/feature/notebook-detail-shell";
import { TaskFormDialog } from "@/components/feature/task-form-dialog";
import { TaskList } from "@/components/feature/task-list";
import { Button } from "@/components/ui/button/button";
import { taskService, type TaskItem } from "@/services/task-service";

export default function NotebookTasksPage() {
  const params = useParams<{ id: string }>();
  const notebookId = params.id;
  const [items, setItems] = useState<TaskItem[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function reload() {
      taskService.listByNotebook(notebookId).then((items) => {
        if (!cancelled) setItems(items);
      });
    }
    reload();
    const off = taskService.subscribe(reload);
    return () => {
      cancelled = true;
      off();
    };
  }, [notebookId]);

  return (
    <NotebookDetailShell>
      <div className="space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Tarefas do caderno
            </h2>
            <p className="text-muted-foreground text-sm">
              Caderno + notas com data + tarefas avulsas vinculadas a este
              caderno.
            </p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="size-4" aria-hidden />
            Nova tarefa
          </Button>
        </header>

        <TaskList items={items} notebookContext={notebookId} />

        <TaskFormDialog
          open={creating}
          onOpenChange={setCreating}
          defaultNotebookId={notebookId}
        />
      </div>
    </NotebookDetailShell>
  );
}
