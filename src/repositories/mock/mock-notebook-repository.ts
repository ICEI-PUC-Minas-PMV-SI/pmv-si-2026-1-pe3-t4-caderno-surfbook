import { Emitter } from "@/lib/emitter";
import { storage } from "@/lib/storage";

import type {
  CreateNotebookInput,
  INotebookRepository,
  Notebook,
  NotebookEvents,
  UpdateNotebookInput,
} from "../notebook-repository";
import { simulateDelay } from "../utils";

const KEY = "notebooks";
const SESSION_KEY = "current-user";

const DEFAULT_ICONS = [
  "book-open",
  "book",
  "notebook",
  "library",
  "graduation-cap",
  "lightbulb",
  "code",
  "palette",
];

function randomIcon(): string {
  return DEFAULT_ICONS[Math.floor(Math.random() * DEFAULT_ICONS.length)];
}

interface SessionUser {
  id: string;
}

function currentOwnerId(): string {
  const user = storage.get<SessionUser | null>(SESSION_KEY, null);
  if (!user) throw new Error("Não autenticado.");
  return user.id;
}

/**
 * Normaliza um caderno potencialmente "antigo" do localStorage —
 * backfill de campos que foram adicionados ao schema depois de o registro existir.
 * Mantém a UI defensiva por padrão sem precisar de migrações ad-hoc.
 */
function normalize(raw: Partial<Notebook>): Notebook {
  return {
    id: raw.id ?? crypto.randomUUID(),
    ownerId: raw.ownerId ?? "",
    name: raw.name ?? "",
    description: raw.description ?? "",
    iconName: raw.iconName,
    coverUrl: raw.coverUrl,
    tags: raw.tags ?? [],
    dueDate: raw.dueDate,
    completedAt: raw.completedAt,
    system: raw.system ?? false,
    hidden: raw.hidden ?? false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export class MockNotebookRepository
  extends Emitter<NotebookEvents>
  implements INotebookRepository
{
  async list(): Promise<Notebook[]> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    return storage
      .get<Partial<Notebook>[]>(KEY, [])
      .map(normalize)
      .filter((n) => n.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Notebook | null> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const found = storage
      .get<Partial<Notebook>[]>(KEY, [])
      .map(normalize)
      .find((n) => n.id === id && n.ownerId === ownerId);
    return found ?? null;
  }

  async create(input: CreateNotebookInput): Promise<Notebook> {
    await simulateDelay();
    const ownerId = currentOwnerId();

    if (!input.name?.trim()) {
      throw new Error("Informe um nome para o caderno.");
    }

    const all = storage.get<Notebook[]>(KEY, []);
    const now = new Date().toISOString();
    const notebook: Notebook = {
      id: crypto.randomUUID(),
      ownerId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      iconName: input.iconName ?? randomIcon(),
      coverUrl: input.coverUrl?.trim() || undefined,
      tags: input.tags ?? [],
      dueDate: input.dueDate || undefined,
      system: input.system ?? false,
      hidden: false,
      createdAt: now,
      updatedAt: now,
    };

    storage.set(KEY, [...all, notebook]);
    this.emit("inserted", notebook);
    return notebook;
  }

  async update(id: string, input: UpdateNotebookInput): Promise<Notebook> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const all = storage.get<Notebook[]>(KEY, []);
    const idx = all.findIndex((n) => n.id === id && n.ownerId === ownerId);
    if (idx === -1) throw new Error("Caderno não encontrado.");

    const updated: Notebook = {
      ...all[idx],
      ...input,
      name: input.name?.trim() ?? all[idx].name,
      description: input.description?.trim() ?? all[idx].description,
      tags: input.tags ?? all[idx].tags,
      // dueDate aceita null como "limpar" — converte pra undefined
      dueDate:
        "dueDate" in input
          ? (input.dueDate ?? undefined)
          : all[idx].dueDate,
      completedAt:
        "completedAt" in input
          ? (input.completedAt ?? undefined)
          : all[idx].completedAt,
      updatedAt: new Date().toISOString(),
    };

    const next = [...all];
    next[idx] = updated;
    storage.set(KEY, next);
    this.emit("updated", { old: all[idx], new: updated });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const all = storage.get<Notebook[]>(KEY, []);
    const target = all.find((n) => n.id === id && n.ownerId === ownerId);
    if (!target) throw new Error("Caderno não encontrado.");
    if (target.system) {
      throw new Error("Cadernos do sistema não podem ser excluídos.");
    }
    storage.set(
      KEY,
      all.filter((n) => !(n.id === id && n.ownerId === ownerId))
    );
    this.emit("removed", target);
  }
}
