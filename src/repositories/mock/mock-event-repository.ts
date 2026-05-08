import { Emitter } from "@/lib/emitter";
import { storage } from "@/lib/storage";

import type {
  CreateStandaloneEventInput,
  IStandaloneEventRepository,
  StandaloneEvent,
  StandaloneEventEvents,
  UpdateStandaloneEventInput,
} from "../event-repository";
import { simulateDelay } from "../utils";

const KEY = "events";
const SESSION_KEY = "current-user";

interface SessionUser {
  id: string;
}

function currentOwnerId(): string {
  const user = storage.get<SessionUser | null>(SESSION_KEY, null);
  if (!user) throw new Error("Não autenticado.");
  return user.id;
}

function normalize(raw: Partial<StandaloneEvent>): StandaloneEvent {
  const now = new Date().toISOString();
  const startDate = raw.startDate ?? new Date().toISOString().slice(0, 10);
  return {
    id: raw.id ?? crypto.randomUUID(),
    ownerId: raw.ownerId ?? "",
    name: raw.name ?? "",
    description: raw.description,
    startDate,
    endDate: raw.endDate ?? startDate,
    allDay: raw.allDay ?? true,
    priority: raw.priority,
    completedAt: raw.completedAt,
    notebookId: raw.notebookId,
    tags: raw.tags ?? [],
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
  };
}

export class MockStandaloneEventRepository
  extends Emitter<StandaloneEventEvents>
  implements IStandaloneEventRepository
{
  async list(): Promise<StandaloneEvent[]> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    return storage
      .get<Partial<StandaloneEvent>[]>(KEY, [])
      .map(normalize)
      .filter((e) => e.ownerId === ownerId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  async get(id: string): Promise<StandaloneEvent | null> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const found = storage
      .get<Partial<StandaloneEvent>[]>(KEY, [])
      .map(normalize)
      .find((e) => e.id === id && e.ownerId === ownerId);
    return found ?? null;
  }

  async create(input: CreateStandaloneEventInput): Promise<StandaloneEvent> {
    await simulateDelay();
    const ownerId = currentOwnerId();

    if (!input.name?.trim()) {
      throw new Error("Informe um nome para o evento.");
    }
    if (!input.startDate) {
      throw new Error("Informe a data do evento.");
    }

    const all = storage.get<StandaloneEvent[]>(KEY, []);
    const now = new Date().toISOString();
    const event: StandaloneEvent = {
      id: crypto.randomUUID(),
      ownerId,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      startDate: input.startDate,
      endDate: input.endDate || input.startDate,
      allDay: input.allDay ?? true,
      priority: input.priority,
      completedAt: undefined,
      notebookId: input.notebookId || undefined,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    storage.set(KEY, [...all, event]);
    this.emit("inserted", event);
    return event;
  }

  async update(
    id: string,
    input: UpdateStandaloneEventInput
  ): Promise<StandaloneEvent> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const all = storage.get<StandaloneEvent[]>(KEY, []);
    const idx = all.findIndex((e) => e.id === id && e.ownerId === ownerId);
    if (idx === -1) throw new Error("Evento não encontrado.");

    const old = all[idx];
    const updated: StandaloneEvent = {
      ...old,
      name: input.name?.trim() ?? old.name,
      description:
        input.description !== undefined
          ? input.description?.trim() || undefined
          : old.description,
      startDate: input.startDate ?? old.startDate,
      endDate: input.endDate ?? input.startDate ?? old.endDate,
      allDay: input.allDay ?? old.allDay,
      priority:
        input.priority !== undefined ? input.priority : old.priority,
      completedAt:
        "completedAt" in input
          ? (input.completedAt ?? undefined)
          : old.completedAt,
      notebookId:
        "notebookId" in input
          ? (input.notebookId ?? undefined)
          : old.notebookId,
      tags: input.tags ?? old.tags,
      updatedAt: new Date().toISOString(),
    };

    const next = [...all];
    next[idx] = updated;
    storage.set(KEY, next);
    this.emit("updated", { old, new: updated });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const all = storage.get<StandaloneEvent[]>(KEY, []);
    const target = all.find((e) => e.id === id && e.ownerId === ownerId);
    if (!target) throw new Error("Evento não encontrado.");
    storage.set(
      KEY,
      all.filter((e) => !(e.id === id && e.ownerId === ownerId))
    );
    this.emit("removed", target);
  }
}
