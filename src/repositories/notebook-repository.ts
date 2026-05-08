import type { Tag } from "@/types/tag";

export interface Notebook {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  iconName?: string;
  coverUrl?: string;
  tags: Tag[];
  /** Data ISO (yyyy-mm-dd) — quando definida, vira um evento no calendário. */
  dueDate?: string;
  /** ISO datetime — marca conclusão. Apenas itens com dueDate viram tasks no
   *  feed de tarefas; este campo registra quando foi marcado feito. */
  completedAt?: string;
  system: boolean;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotebookInput {
  name: string;
  description?: string;
  iconName?: string;
  coverUrl?: string;
  tags?: Tag[];
  dueDate?: string;
  /** Marca como caderno do sistema (não pode ser excluído). Usado pelo seed do tutorial. */
  system?: boolean;
}

export interface UpdateNotebookInput {
  name?: string;
  description?: string;
  iconName?: string;
  coverUrl?: string;
  tags?: Tag[];
  dueDate?: string | null;
  /** null limpa (volta a pendente); string ISO marca conclusão. */
  completedAt?: string | null;
  hidden?: boolean;
}

export type NotebookEvents = {
  inserted: Notebook;
  updated: { old: Notebook; new: Notebook };
  removed: Notebook;
};

export interface INotebookRepository {
  list(): Promise<Notebook[]>;
  get(id: string): Promise<Notebook | null>;
  create(input: CreateNotebookInput): Promise<Notebook>;
  update(id: string, input: UpdateNotebookInput): Promise<Notebook>;
  delete(id: string): Promise<void>;

  on<K extends keyof NotebookEvents>(
    event: K,
    cb: (data: NotebookEvents[K]) => void
  ): () => void;
  off<K extends keyof NotebookEvents>(
    event: K,
    cb: (data: NotebookEvents[K]) => void
  ): void;
}
