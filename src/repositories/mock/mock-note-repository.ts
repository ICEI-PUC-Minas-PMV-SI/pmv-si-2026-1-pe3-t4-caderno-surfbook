import { Emitter } from "@/lib/emitter";
import { storage } from "@/lib/storage";

import type {
  CreateNoteInput,
  INoteRepository,
  Note,
  NoteEvents,
  UpdateNoteInput,
} from "../note-repository";
import { simulateDelay } from "../utils";

const KEY = "notes";
const SESSION_KEY = "current-user";

interface SessionUser {
  id: string;
}

function currentOwnerId(): string {
  const user = storage.get<SessionUser | null>(SESSION_KEY, null);
  if (!user) throw new Error("Não autenticado.");
  return user.id;
}

/* Migra items legados (string[]) e injeta `indent: 0` quando ausente. */
function normalizeNodes(raw: unknown): Note["nodes"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((node) => {
    if (!node || typeof node !== "object") return node as Note["nodes"][number];
    const n = node as Record<string, unknown>;
    if (n.type === "list" || n.type === "checklist") {
      const items = Array.isArray(n.items) ? n.items : [];
      return {
        ...n,
        items: items.map((item) => {
          if (typeof item === "string") {
            return n.type === "checklist"
              ? {
                  id: crypto.randomUUID(),
                  checked: false,
                  text: item,
                  indent: 0,
                }
              : { text: item, indent: 0 };
          }
          if (item && typeof item === "object") {
            const it = item as Record<string, unknown>;
            const indent =
              typeof it.indent === "number" && it.indent >= 0 ? it.indent : 0;
            if (n.type === "checklist") {
              return {
                // Backfill id em items antigos sem essa propriedade
                id:
                  typeof it.id === "string" && it.id
                    ? it.id
                    : crypto.randomUUID(),
                checked: Boolean(it.checked),
                text: String(it.text ?? ""),
                indent,
              };
            }
            return { text: String(it.text ?? ""), indent };
          }
          return n.type === "checklist"
            ? {
                id: crypto.randomUUID(),
                checked: false,
                text: "",
                indent: 0,
              }
            : { text: "", indent: 0 };
        }),
      } as Note["nodes"][number];
    }
    return node as Note["nodes"][number];
  });
}

function normalize(raw: Partial<Note>): Note {
  const now = new Date().toISOString();
  return {
    id: raw.id ?? crypto.randomUUID(),
    ownerId: raw.ownerId ?? "",
    notebookId: raw.notebookId ?? "",
    title: raw.title ?? "",
    nodes: normalizeNodes(raw.nodes),
    tags: raw.tags ?? [],
    dueDate: raw.dueDate,
    completedAt: raw.completedAt,
    position: typeof raw.position === "number" ? raw.position : 0,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
  };
}

export class MockNoteRepository
  extends Emitter<NoteEvents>
  implements INoteRepository
{
  async listByNotebook(notebookId: string): Promise<Note[]> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    return storage
      .get<Partial<Note>[]>(KEY, [])
      .map(normalize)
      .filter((n) => n.ownerId === ownerId && n.notebookId === notebookId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listAll(): Promise<Note[]> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    return storage
      .get<Partial<Note>[]>(KEY, [])
      .map(normalize)
      .filter((n) => n.ownerId === ownerId);
  }

  async get(id: string): Promise<Note | null> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const found = storage
      .get<Partial<Note>[]>(KEY, [])
      .map(normalize)
      .find((n) => n.id === id && n.ownerId === ownerId);
    return found ?? null;
  }

  async create(input: CreateNoteInput): Promise<Note> {
    await simulateDelay();
    const ownerId = currentOwnerId();

    if (!input.notebookId) {
      throw new Error("notebookId é obrigatório.");
    }

    const all = storage.get<Partial<Note>[]>(KEY, []).map(normalize);
    const inSameNotebook = all.filter(
      (n) => n.notebookId === input.notebookId && n.ownerId === ownerId
    );
    const maxPos = inSameNotebook.reduce(
      (max, n) => Math.max(max, n.position),
      -1
    );
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      ownerId,
      notebookId: input.notebookId,
      title: input.title?.trim() ?? "",
      nodes: input.nodes ?? [],
      tags: input.tags ?? [],
      dueDate: input.dueDate || undefined,
      position: maxPos + 1,
      createdAt: now,
      updatedAt: now,
    };

    storage.set(KEY, [...all, note]);
    this.emit("inserted", note);
    return note;
  }

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    await simulateDelay();
    const ownerId = currentOwnerId();
    const all = storage.get<Note[]>(KEY, []);
    const idx = all.findIndex((n) => n.id === id && n.ownerId === ownerId);
    if (idx === -1) throw new Error("Nota não encontrada.");

    const updated: Note = {
      ...all[idx],
      title: input.title !== undefined ? input.title : all[idx].title,
      nodes: input.nodes ?? all[idx].nodes,
      tags: input.tags ?? all[idx].tags,
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
    const all = storage.get<Note[]>(KEY, []);
    const target = all.find((n) => n.id === id && n.ownerId === ownerId);
    if (!target) throw new Error("Nota não encontrada.");

    storage.set(
      KEY,
      all.filter((n) => !(n.id === id && n.ownerId === ownerId))
    );
    this.emit("removed", target);
  }
}
