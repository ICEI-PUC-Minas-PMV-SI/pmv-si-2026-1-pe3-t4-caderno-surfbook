import { Emitter } from "@/lib/emitter";
import { storage } from "@/lib/storage";

import type {
  CreateStandaloneTaskInput,
  IStandaloneTaskRepository,
  StandaloneTask,
  StandaloneTaskEvents,
  UpdateStandaloneTaskInput,
} from "../task-repository";
import { simulateDelay } from "../utils";

const KEY = "tasks";
const SESSION_KEY = "current-user";

interface SessionUser {
  id: string;
}

function currentOwnerId(): string {
  const user = storage.get<SessionUser | null>(SESSION_KEY, null);
  if (!user) throw new Error("Não autenticado.");
  return user.id;
}

function normalize(raw: Partial<StandaloneTask>): StandaloneTask {
  const now = new Date().toISOString();
  return {
    id: raw.id ?? crypto.randomUUID(),
    ownerId: raw.ownerId ?? "",
    title: raw.title ?? "",
    description: raw.description,
    dueDate: raw.dueDate,
    completedAt: raw.completedAt,
    priority: raw.priority,
    parentId: raw.parentId,
    level: typeof raw.level === "number" ? raw.level : 0,
    position: typeof raw.position === "number" ? raw.position : 0,
    notebookId: raw.notebookId,
    tags: raw.tags ?? [],
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
  };
}

/**
 * Recalcula `level` resolvendo a cadeia de parents. Limita a 8 níveis pra
 * evitar loops em data corrompida.
 */
function levelFor(
  parentId: string | undefined,
  byId: Map<string, StandaloneTask>
): number {
  if (!parentId) return 0;
  let lvl = 0;
  let cur: string | undefined = parentId;
  for (let i = 0; i < 8 && cur; i++) {
    const p = byId.get(cur);
    if (!p) break;
    lvl++;
    cur = p.parentId;
  }
  return lvl;
}

function nextSiblingPosition(
  parentId: string | undefined,
  ownerId: string,
  all: StandaloneTask[]
): number {
  const siblings = all.filter(
    (t) =>
      t.ownerId === ownerId &&
      (t.parentId ?? null) === (parentId ?? null)
  );
  return siblings.reduce((max, t) => Math.max(max, t.position), -1) + 1;
}

export class MockStandaloneTaskRepository
  extends Emitter<StandaloneTaskEvents>
  implements IStandaloneTaskRepository
{
  async list(): Promise<StandaloneTask[]> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    return storage
      .get<Partial<StandaloneTask>[]>(KEY, [])
      .map(normalize)
      .filter((t) => t.ownerId === ownerId)
      .sort((a, b) => a.position - b.position);
  }

  async get(id: string): Promise<StandaloneTask | null> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const found = storage
      .get<Partial<StandaloneTask>[]>(KEY, [])
      .map(normalize)
      .find((t) => t.id === id && t.ownerId === ownerId);
    return found ?? null;
  }

  async create(input: CreateStandaloneTaskInput): Promise<StandaloneTask> {
    await simulateDelay();
    const ownerId = currentOwnerId();

    if (!input.title?.trim()) {
      throw new Error("Informe o título da tarefa.");
    }

    const all = storage.get<StandaloneTask[]>(KEY, []).map(normalize);
    const byId = new Map(all.map((t) => [t.id, t]));
    const now = new Date().toISOString();

    const task: StandaloneTask = {
      id: crypto.randomUUID(),
      ownerId,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      dueDate: input.dueDate || undefined,
      completedAt: undefined,
      priority: input.priority,
      parentId: input.parentId,
      level: levelFor(input.parentId, byId),
      position: nextSiblingPosition(input.parentId, ownerId, all),
      notebookId: input.notebookId,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    storage.set(KEY, [...all, task]);
    this.emit("inserted", task);
    return task;
  }

  async update(
    id: string,
    input: UpdateStandaloneTaskInput
  ): Promise<StandaloneTask> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const all = storage.get<StandaloneTask[]>(KEY, []).map(normalize);
    const idx = all.findIndex((t) => t.id === id && t.ownerId === ownerId);
    if (idx === -1) throw new Error("Tarefa não encontrada.");

    const old = all[idx];
    const newParentId =
      "parentId" in input ? (input.parentId ?? undefined) : old.parentId;

    const byId = new Map(all.map((t) => [t.id, t]));
    // Garante que não está movendo pra debaixo de um descendente
    if (newParentId) {
      let cur: string | undefined = newParentId;
      for (let i = 0; i < 16 && cur; i++) {
        if (cur === id) {
          throw new Error("Não pode mover sob descendente próprio.");
        }
        cur = byId.get(cur)?.parentId;
      }
    }

    const updated: StandaloneTask = {
      ...old,
      title: input.title?.trim() ?? old.title,
      description:
        input.description !== undefined
          ? input.description?.trim() || undefined
          : old.description,
      dueDate:
        "dueDate" in input ? (input.dueDate ?? undefined) : old.dueDate,
      completedAt:
        "completedAt" in input
          ? (input.completedAt ?? undefined)
          : old.completedAt,
      priority:
        input.priority !== undefined ? input.priority : old.priority,
      parentId: newParentId,
      level: levelFor(newParentId, byId),
      position: input.position ?? old.position,
      notebookId:
        "notebookId" in input
          ? (input.notebookId ?? undefined)
          : old.notebookId,
      tags: input.tags ?? old.tags,
      updatedAt: new Date().toISOString(),
    };

    const next = [...all];
    next[idx] = updated;

    // Se mudou parent, recalcula level dos descendentes (cascata)
    if (newParentId !== old.parentId) {
      const descendantOf = (taskId: string): string[] => {
        const direct = next.filter((t) => t.parentId === taskId);
        return direct.flatMap((d) => [d.id, ...descendantOf(d.id)]);
      };
      const descIds = descendantOf(id);
      const newById = new Map(next.map((t) => [t.id, t]));
      for (const dId of descIds) {
        const dIdx = next.findIndex((t) => t.id === dId);
        if (dIdx !== -1) {
          next[dIdx] = {
            ...next[dIdx],
            level: levelFor(next[dIdx].parentId, newById),
            updatedAt: updated.updatedAt,
          };
        }
      }
    }

    storage.set(KEY, next);
    this.emit("updated", { old, new: updated });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const all = storage.get<StandaloneTask[]>(KEY, []).map(normalize);
    const target = all.find((t) => t.id === id && t.ownerId === ownerId);
    if (!target) throw new Error("Tarefa não encontrada.");

    // Remove descendentes em cascata
    const descendantOf = (taskId: string): Set<string> => {
      const out = new Set<string>();
      const stack = [taskId];
      while (stack.length > 0) {
        const cur = stack.pop()!;
        for (const t of all) {
          if (t.parentId === cur && !out.has(t.id)) {
            out.add(t.id);
            stack.push(t.id);
          }
        }
      }
      return out;
    };
    const toDelete = descendantOf(id);
    toDelete.add(id);

    storage.set(
      KEY,
      all.filter((t) => !toDelete.has(t.id))
    );
    this.emit("removed", target);
  }
}
