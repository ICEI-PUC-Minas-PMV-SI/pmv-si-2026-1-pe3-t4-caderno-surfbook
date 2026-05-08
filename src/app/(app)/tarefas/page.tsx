"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { TaskFormDialog } from "@/components/feature/task-form-dialog";
import { TaskList } from "@/components/feature/task-list";
import { Button } from "@/components/ui/button/button";
import { taskService, type TaskItem } from "@/services/task-service";

export default function GlobalTasksPage() {
  const [items, setItems] = useState<TaskItem[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function reload() {
      taskService.listAll().then((items) => {
        if (!cancelled) setItems(items);
      });
    }
    reload();
    const off = taskService.subscribe(reload);
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Tarefas
          </h1>
          <p className="text-muted-foreground">
            Visão consolidada — cadernos e notas com data limite, mais tarefas
            avulsas com hierarquia.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="size-4" aria-hidden />
          Nova tarefa
        </Button>
      </header>

      <TaskList items={items} />

      <TaskFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
