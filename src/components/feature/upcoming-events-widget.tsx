"use client";

import { ArrowRight, BookOpen, CalendarClock, FileText } from "lucide-react";
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
import {
  eventService,
  type CalendarEvent,
} from "@/services/event-service";

/**
 * Widget de "próximos prazos" no dashboard. Lista os próximos N itens com
 * data definida (cadernos ou notas), em ordem cronológica.
 *
 * Reativo: subscreve mudanças nos services base — adicionar/remover data
 * em qualquer caderno/nota atualiza a lista sem refresh.
 */

const LIMIT = 5;

function formatRelative(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff > 1 && diff <= 7) return `em ${diff} dias`;
  return target.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

const ICON_BG: Record<CalendarEvent["parentType"], string> = {
  notebook: "bg-brand-100 text-brand-700",
  note: "bg-amber-100 text-amber-800",
  event: "bg-violet-100 text-violet-700",
};

function EventTypeIcon({ type }: { type: CalendarEvent["parentType"] }) {
  if (type === "notebook") return <BookOpen className="size-3.5" aria-hidden />;
  if (type === "note") return <FileText className="size-3.5" aria-hidden />;
  return <CalendarClock className="size-3.5" aria-hidden />;
}

export function UpcomingEventsWidget() {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const peek = usePeek();

  useEffect(() => {
    let cancelled = false;
    function reload() {
      eventService.listUpcoming(LIMIT).then((evs) => {
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
    <Card variant="interactive">
      <CardHeader>
        <div className="bg-amber-100 text-amber-700 flex size-10 items-center justify-center rounded">
          <CalendarClock className="size-5" aria-hidden />
        </div>
        <CardTitle>Próximos prazos</CardTitle>
        <CardDescription>
          Cadernos e notas com data limite. Adicione uma data em qualquer
          caderno ou nota e ela aparece aqui.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events === null ? (
          <p className="text-muted-foreground text-sm">Carregando…</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum prazo nos próximos dias.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (ev.parentType === "notebook")
                      peek.openNotebookPeek(ev.parentId);
                    else if (ev.parentType === "note")
                      peek.openNotePeek(ev.parentId);
                    else peek.openEventPeek(ev.parentId);
                  }}
                  className="hover:bg-muted/50 flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition-colors"
                >
                  <div
                    className={`${ICON_BG[ev.parentType]} flex size-7 shrink-0 items-center justify-center rounded`}
                  >
                    <EventTypeIcon type={ev.parentType} />
                  </div>
                  <span className="flex-1 truncate text-sm">
                    {parseInline(ev.name)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatRelative(ev.startDate)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/calendario">
              Ver calendário
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
