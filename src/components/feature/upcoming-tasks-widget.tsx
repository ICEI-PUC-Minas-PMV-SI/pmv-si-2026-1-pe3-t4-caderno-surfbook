"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckSquare,
  FileText,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { usePeek } from "@/components/feature/peek-provider";
import { Button } from "@/components/ui/button/button";
import { parseInline } from "@/lib/inline-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card/card";
import { useToast } from "@/components/ui/toast/toast";
import { cn } from "@/lib/utils";
import { taskService, type TaskItem } from "@/services/task-service";

/**
 * Widget de "tarefas pendentes" pro dashboard. Pega as primeiras N pendentes
 * do feed agregado (caderno+nota+evento+standalone), ordenadas por dueDate
 * ascendente. Cada linha tem checkbox que toggla conclusão direto sem sair
 * da home — mesmo padrão do widget de eventos.
 */

const LIMIT = 6;

const ICON_BG: Record<TaskItem["parentType"], string> = {
  notebook: "bg-brand-100 text-brand-700",
  note: "bg-amber-100 text-amber-800",
  event: "bg-violet-100 text-violet-700",
  task: "bg-emerald-100 text-emerald-700",
  "checklist-item": "bg-amber-50 text-amber-700",
};

function ParentIcon({ type }: { type: TaskItem["parentType"] }) {
  if (type === "notebook") return <BookOpen className="size-3.5" aria-hidden />;
  if (type === "note") return <FileText className="size-3.5" aria-hidden />;
  if (type === "event")
    return <CalendarClock className="size-3.5" aria-hidden />;
  if (type === "checklist-item")
    return <CheckSquare className="size-3.5" aria-hidden />;
  return <CheckSquare className="size-3.5" aria-hidden />;
}

function formatRelative(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff < -1) return `${-diff}d atrás`;
  if (diff > 1 && diff <= 7) return `em ${diff} dias`;
  return target.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function UpcomingTasksWidget() {
  const [items, setItems] = useState<TaskItem[] | null>(null);
  const peek = usePeek();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    function reload() {
      taskService.listAll().then((all) => {
        if (cancelled) return;
        const pending = all.filter((t) => !t.completedAt);
        // Ordena: com dueDate primeiro (asc), sem dueDate ao final
        pending.sort((a, b) => {
          const aKey = a.dueDate ?? "9999-99-99";
          const bKey = b.dueDate ?? "9999-99-99";
          return aKey.localeCompare(bKey);
        });
        setItems(pending.slice(0, LIMIT));
      });
    }
    reload();
    const off = taskService.subscribe(reload);
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  async function toggle(item: TaskItem) {
    try {
      await taskService.toggleCompleted(item);
    } catch (err) {
      toast({
        title: "Falha ao atualizar",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    }
  }

  function openItem(item: TaskItem) {
    if (item.parentType === "notebook") peek.openNotebookPeek(item.sourceId);
    else if (item.parentType === "note") peek.openNotePeek(item.sourceId);
    else if (item.parentType === "event") peek.openEventPeek(item.sourceId);
    else if (item.parentType === "checklist-item" && item.noteId)
      peek.openNotePeek(item.noteId);
    // task: por enquanto só toggle inline. Ir pra /tarefas pra editar.
  }

  return (
    <Card variant="interactive">
      <CardHeader>
        <div className="bg-emerald-100 text-emerald-700 flex size-10 items-center justify-center rounded">
          <ListTodo className="size-5" aria-hidden />
        </div>
        <CardTitle>Tarefas pendentes</CardTitle>
        <CardDescription>
          Cadernos, notas, eventos e tarefas com data limite. Marque como
          cumprido aqui mesmo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <p className="text-muted-foreground text-sm">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nada pendente no momento.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="hover:bg-muted/50 flex items-center gap-2 rounded px-2 py-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!!item.completedAt}
                  onChange={() => toggle(item)}
                  aria-label={`Marcar “${item.title}” como cumprida`}
                  className="border-border accent-brand-500 size-4 shrink-0 rounded"
                />
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded",
                      ICON_BG[item.parentType]
                    )}
                  >
                    <ParentIcon type={item.parentType} />
                  </div>
                  <span className="flex-1 truncate text-sm">
                    {parseInline(item.title)}
                  </span>
                  {item.dueDate && (
                    <span className="text-muted-foreground text-xs">
                      {formatRelative(item.dueDate)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/tarefas">
              Ver todas
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
