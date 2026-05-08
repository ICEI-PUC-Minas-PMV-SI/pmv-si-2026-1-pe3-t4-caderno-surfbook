"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { MonthCalendar } from "@/components/feature/month-calendar";
import { NotebookDetailShell } from "@/components/feature/notebook-detail-shell";
import { usePeek } from "@/components/feature/peek-provider";
import { Button } from "@/components/ui/button/button";
import {
  eventService,
  type CalendarEvent,
} from "@/services/event-service";

export default function NotebookCalendarPage() {
  const params = useParams<{ id: string }>();
  const notebookId = params.id;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const peek = usePeek();

  useEffect(() => {
    let cancelled = false;
    function reload() {
      eventService.listByNotebook(notebookId).then((evs) => {
        if (!cancelled) setEvents(evs);
      });
    }
    reload();
    const off = eventService.subscribe(reload);
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
              Calendário do caderno
            </h2>
            <p className="text-muted-foreground text-sm">
              Eventos derivados (caderno + notas com data) e eventos avulsos
              vinculados a este caderno.
            </p>
          </div>
          <Button onClick={() => peek.openEventNew(notebookId)} size="sm">
            <Plus className="size-4" aria-hidden />
            Novo evento
          </Button>
        </header>
        <MonthCalendar events={events} />
      </div>
    </NotebookDetailShell>
  );
}
