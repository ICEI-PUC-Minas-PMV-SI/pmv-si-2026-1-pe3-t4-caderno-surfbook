import { isApiEnabled } from "@/lib/api";
import { MockStandaloneEventRepository } from "@/repositories/mock/mock-event-repository";
import type {
  IStandaloneEventRepository,
  StandaloneEventEvents,
} from "@/repositories/event-repository";
import { noteService, type Note } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

/**
 * **Eventos no calendário** vêm de três fontes:
 *
 * 1. **Derivado de Notebook** — caderno com `dueDate` projeta um evento
 *    `notebook-<id>`.
 * 2. **Derivado de Note** — nota com `dueDate` projeta um evento `note-<id>`.
 * 3. **Standalone (`StandaloneEvent`)** — entidade própria, persistida em
 *    seu próprio repositório. Lembretes pessoais que não cabem como conteúdo
 *    ("prova", "consulta", "entrega"), com ou sem caderno associado.
 *
 * O `eventService` faz o agregador. UI consome só `CalendarEvent[]`, sem
 * saber a origem (exceto pelo `parentType` quando precisa rotear/editar).
 *
 * Reatividade: `subscribe(cb)` compõe os emitters das três fontes —
 * mudou em qualquer uma, o callback dispara.
 */

const standaloneRepo: IStandaloneEventRepository = isApiEnabled
  ? (() => {
      throw new Error(
        "ApiStandaloneEventRepository ainda não implementado — backend real fora do escopo do eixo-3."
      );
    })()
  : new MockStandaloneEventRepository();

export interface CalendarEvent {
  /** Id sintético: `notebook-<id>`, `note-<id>` ou `event-<id>`. */
  id: string;
  name: string;
  /** Data ISO yyyy-mm-dd. */
  startDate: string;
  endDate: string;
  allDay: boolean;
  parentType: "notebook" | "note" | "event";
  /** Id do recurso de origem. */
  parentId: string;
  /** Caderno ao qual o evento se associa. Pode ser undefined em eventos
   *  standalone que não foram vinculados a nenhum caderno. */
  notebookId?: string;
}

function fromNotebook(nb: Notebook): CalendarEvent | null {
  if (!nb.dueDate) return null;
  return {
    id: `notebook-${nb.id}`,
    name: nb.name || "Caderno sem nome",
    startDate: nb.dueDate,
    endDate: nb.dueDate,
    allDay: true,
    parentType: "notebook",
    parentId: nb.id,
    notebookId: nb.id,
  };
}

function fromNote(n: Note): CalendarEvent | null {
  if (!n.dueDate) return null;
  return {
    id: `note-${n.id}`,
    name: n.title || "Nota sem título",
    startDate: n.dueDate,
    endDate: n.dueDate,
    allDay: true,
    parentType: "note",
    parentId: n.id,
    notebookId: n.notebookId,
  };
}

import type { StandaloneEvent } from "@/repositories/event-repository";

function fromStandalone(e: StandaloneEvent): CalendarEvent {
  return {
    id: `event-${e.id}`,
    name: e.name,
    startDate: e.startDate,
    endDate: e.endDate,
    allDay: e.allDay,
    parentType: "event",
    parentId: e.id,
    notebookId: e.notebookId,
  };
}

export const eventService = {
  // ---------------- CRUD on standalone events ----------------
  listStandalone: () => standaloneRepo.list(),
  getStandalone: (id: string) => standaloneRepo.get(id),
  createStandalone: (
    input: Parameters<IStandaloneEventRepository["create"]>[0]
  ) => standaloneRepo.create(input),
  updateStandalone: (
    id: string,
    input: Parameters<IStandaloneEventRepository["update"]>[1]
  ) => standaloneRepo.update(id, input),
  deleteStandalone: (id: string) => standaloneRepo.delete(id),

  onStandalone: <K extends keyof StandaloneEventEvents>(
    event: K,
    cb: (data: StandaloneEventEvents[K]) => void
  ) => standaloneRepo.on(event, cb),

  // ---------------- Calendar projection ----------------
  async listAll(): Promise<CalendarEvent[]> {
    const [notebooks, notes, standalones] = await Promise.all([
      notebookService.list(),
      noteService.listAll(),
      standaloneRepo.list(),
    ]);
    const out: CalendarEvent[] = [];
    for (const nb of notebooks) {
      const ev = fromNotebook(nb);
      if (ev) out.push(ev);
    }
    for (const n of notes) {
      const ev = fromNote(n);
      if (ev) out.push(ev);
    }
    for (const s of standalones) {
      out.push(fromStandalone(s));
    }
    return out.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  async listByNotebook(notebookId: string): Promise<CalendarEvent[]> {
    const all = await this.listAll();
    return all.filter((e) => e.notebookId === notebookId);
  },

  /** Próximos N eventos a partir de hoje (inclusive). */
  async listUpcoming(limit = 5): Promise<CalendarEvent[]> {
    const all = await this.listAll();
    const today = new Date().toISOString().slice(0, 10);
    return all.filter((e) => e.endDate >= today).slice(0, limit);
  },

  /** Inscreve callback em qualquer mudança. Composto sobre os 3 emitters. */
  subscribe(cb: () => void): () => void {
    const offs: Array<() => void> = [];
    offs.push(notebookService.on("inserted", () => cb()));
    offs.push(notebookService.on("updated", () => cb()));
    offs.push(notebookService.on("removed", () => cb()));
    offs.push(noteService.on("inserted", () => cb()));
    offs.push(noteService.on("updated", () => cb()));
    offs.push(noteService.on("removed", () => cb()));
    offs.push(standaloneRepo.on("inserted", () => cb()));
    offs.push(standaloneRepo.on("updated", () => cb()));
    offs.push(standaloneRepo.on("removed", () => cb()));
    return () => {
      for (const off of offs) off();
    };
  },
};

export type {
  CreateStandaloneEventInput,
  EventPriority,
  StandaloneEvent,
  UpdateStandaloneEventInput,
} from "@/repositories/event-repository";
export type { Notebook, Note };
