"use client";

import {
  BookOpen,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";

import { usePeek } from "@/components/feature/peek-provider";
import { Button } from "@/components/ui/button/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/services/event-service";

/**
 * Month view do calendário. Renderiza uma grade 7×6 (sem dependência externa)
 * com eventos chip-style nos dias. Cada chip linka pra origem (caderno ou nota).
 *
 * **Por que 6 semanas fixas:** evita "pulo" de altura conforme o mês muda.
 * **Semana começa no domingo** (convenção pt-BR).
 */

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

interface MonthCalendarProps {
  events: CalendarEvent[];
  /** Quando true, mostra rótulo do caderno em cada chip (útil em vista global). */
  showNotebookContext?: boolean;
}

interface DayCell {
  date: string; // yyyy-mm-dd
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildMonthGrid(year: number, month0: number): DayCell[] {
  const first = new Date(year, month0, 1);
  // Recua até o domingo (getDay: 0 = domingo)
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const todayIso = isoDate(new Date());
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      date: isoDate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month0,
      isToday: isoDate(d) === todayIso,
    });
  }
  return cells;
}

const CHIP_CLASSES: Record<CalendarEvent["parentType"], string> = {
  notebook: "bg-brand-100 text-brand-700 hover:bg-brand-200",
  note: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  event: "bg-violet-100 text-violet-700 hover:bg-violet-200",
};

function EventIcon({ type }: { type: CalendarEvent["parentType"] }) {
  if (type === "notebook")
    return <BookOpen className="size-2.5 shrink-0" aria-hidden />;
  if (type === "note")
    return <FileText className="size-2.5 shrink-0" aria-hidden />;
  return <CalendarClock className="size-2.5 shrink-0" aria-hidden />;
}

export function MonthCalendar({
  events,
  showNotebookContext = false,
}: MonthCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const peek = usePeek();

  function openPeek(ev: CalendarEvent) {
    if (ev.parentType === "notebook") peek.openNotebookPeek(ev.parentId);
    else if (ev.parentType === "note") peek.openNotePeek(ev.parentId);
    else peek.openEventPeek(ev.parentId);
  }

  const cells = useMemo(() => buildMonthGrid(year, month0), [year, month0]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const arr = map.get(ev.startDate);
      if (arr) arr.push(ev);
      else map.set(ev.startDate, [ev]);
    }
    return map;
  }, [events]);

  function shiftMonth(delta: number) {
    let m = month0 + delta;
    let y = year;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    setMonth0(m);
    setYear(y);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth0(today.getMonth());
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold capitalize">
          {MONTH_NAMES[month0]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => shiftMonth(-1)}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => shiftMonth(1)}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="bg-surface overflow-hidden rounded-lg border">
        <div className="text-muted-foreground grid grid-cols-7 border-b text-xs">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-1.5 text-center font-medium uppercase"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const dayEvents = eventsByDate.get(cell.date) ?? [];
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[5.5rem] border-r border-b p-1.5 text-xs last:border-r-0",
                  i % 7 === 6 && "border-r-0",
                  i >= 35 && "border-b-0",
                  !cell.inMonth && "bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "mb-1 inline-flex size-5 items-center justify-center rounded-full",
                    cell.isToday && "bg-brand-500 text-white font-semibold",
                    !cell.inMonth && "text-muted-foreground/50",
                    cell.inMonth && !cell.isToday && "text-muted-foreground"
                  )}
                >
                  {cell.day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => openPeek(ev)}
                      className={cn(
                        "flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left transition-colors",
                        CHIP_CLASSES[ev.parentType]
                      )}
                      title={ev.name}
                    >
                      <EventIcon type={ev.parentType} />
                      <span className="truncate">{ev.name}</span>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-muted-foreground px-1 text-[10px]">
                      +{dayEvents.length - 3} mais
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showNotebookContext && events.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhum item com data ainda. Adicione uma <strong>data limite</strong>{" "}
          a um caderno ou nota e ele aparece aqui automaticamente.
        </p>
      )}
    </div>
  );
}
