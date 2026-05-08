"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { MonthCalendar } from "@/components/feature/month-calendar";
import { usePeek } from "@/components/feature/peek-provider";
import { Button } from "@/components/ui/button/button";
import {
  eventService,
  type CalendarEvent,
} from "@/services/event-service";

export default function GlobalCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const peek = usePeek();

  useEffect(() => {
    let cancelled = false;
    function reload() {
      eventService.listAll().then((evs) => {
        if (!cancelled) setEvents(evs);
      });
    }
    reload();
    const off = eventService.subscribe(reload);
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
            Calendário
          </h1>
          <p className="text-muted-foreground">
            Visão consolidada — qualquer caderno ou nota com data limite, mais
            eventos avulsos.
          </p>
        </div>
        <Button onClick={() => peek.openEventNew()} size="sm">
          <Plus className="size-4" aria-hidden />
          Novo evento
        </Button>
      </header>
      <MonthCalendar events={events} showNotebookContext />
    </div>
  );
}
