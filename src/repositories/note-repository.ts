import type { NoteNode } from "@/types/note-node";
import type { Tag } from "@/types/tag";

export interface Note {
  id: string;
  ownerId: string;
  notebookId: string;
  title: string;
  /** Conteúdo em forma de blocos tipados (modelo Notion-like). */
  nodes: NoteNode[];
  tags: Tag[];
  /** Data ISO (yyyy-mm-dd) — quando definida, vira um evento no calendário. */
  dueDate?: string;
  /** ISO datetime — marca conclusão. Apenas notas com dueDate viram tasks no
   *  feed de tarefas; este campo registra quando foi marcado feito. */
  completedAt?: string;
  /** Posição na ordem manual dentro do caderno (incrementa por criação). */
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  notebookId: string;
  title?: string;
  nodes?: NoteNode[];
  tags?: Tag[];
  dueDate?: string;
}

export interface UpdateNoteInput {
  title?: string;
  nodes?: NoteNode[];
  tags?: Tag[];
  dueDate?: string | null;
  /** null limpa (volta a pendente); string ISO marca conclusão. */
  completedAt?: string | null;
}

export type NoteEvents = {
  inserted: Note;
  updated: { old: Note; new: Note };
  removed: Note;
};

export interface INoteRepository {
  listByNotebook(notebookId: string): Promise<Note[]>;
  listAll(): Promise<Note[]>;
  get(id: string): Promise<Note | null>;
  create(input: CreateNoteInput): Promise<Note>;
  update(id: string, input: UpdateNoteInput): Promise<Note>;
  delete(id: string): Promise<void>;

  on<K extends keyof NoteEvents>(
    event: K,
    cb: (data: NoteEvents[K]) => void
  ): () => void;
  off<K extends keyof NoteEvents>(
    event: K,
    cb: (data: NoteEvents[K]) => void
  ): void;
}
