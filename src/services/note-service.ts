import { isApiEnabled } from "@/lib/api";
import type {
  INoteRepository,
  NoteEvents,
} from "@/repositories/note-repository";
import { MockNoteRepository } from "@/repositories/mock/mock-note-repository";

const repo: INoteRepository = isApiEnabled
  ? (() => {
      throw new Error(
        "ApiNoteRepository ainda não implementado — backend real fora do escopo do eixo-3."
      );
    })()
  : new MockNoteRepository();

export const noteService = {
  listByNotebook: (notebookId: string) => repo.listByNotebook(notebookId),
  listAll: () => repo.listAll(),
  get: (id: string) => repo.get(id),
  create: (input: Parameters<INoteRepository["create"]>[0]) =>
    repo.create(input),
  update: (id: string, input: Parameters<INoteRepository["update"]>[1]) =>
    repo.update(id, input),
  delete: (id: string) => repo.delete(id),

  on: <K extends keyof NoteEvents>(
    event: K,
    cb: (data: NoteEvents[K]) => void
  ) => repo.on(event, cb),
  off: <K extends keyof NoteEvents>(
    event: K,
    cb: (data: NoteEvents[K]) => void
  ) => repo.off(event, cb),
};

export type {
  CreateNoteInput,
  Note,
  NoteEvents,
  UpdateNoteInput,
} from "@/repositories/note-repository";
export type {
  BookmarkNode,
  BookmarkRef,
  ChecklistItem,
  ChecklistNode,
  CodeNode,
  DividerNode,
  HeadingNode,
  ImageNode,
  ListItem,
  ListNode,
  NoteNode,
  NoteNodeType,
  ParagraphNode,
  QuoteNode,
} from "@/types/note-node";
