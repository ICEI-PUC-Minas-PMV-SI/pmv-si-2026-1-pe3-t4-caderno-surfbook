import type { Tag } from "@/types/tag";

import type { EventPriority } from "./event-repository";

/**
 * Repositório de **tarefas standalone** — afazeres pessoais com hierarquia
 * multi-nível (parent_id + level), prioridade e marcação de conclusão.
 *
 * O `taskService` (no nível de service) é o agregador: combina estas tasks
 * standalone com tasks derivadas de Notebook/Note (que têm `dueDate`) num
 * único feed de checklist multi-nível, espelhando o comportamento de
 * `events-client.js` + `task-client.js` do eixo-1.
 */

export type TaskPriority = EventPriority;

export interface StandaloneTask {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  /** ISO yyyy-mm-dd. Opcional pra tasks sem prazo. */
  dueDate?: string;
  /** ISO datetime. Quando definido, task aparece como concluída. */
  completedAt?: string;
  priority?: TaskPriority;
  /** Id da task pai. null = raiz. */
  parentId?: string;
  /** Profundidade na árvore (0 = raiz). Calculado e mantido no repo. */
  level: number;
  /** Posição entre os irmãos (mesmo parentId). */
  position: number;
  /** Caderno opcionalmente associado. */
  notebookId?: string;
  /** Tags compartilhadas com outras entidades. */
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStandaloneTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  parentId?: string;
  notebookId?: string;
  tags?: Tag[];
}

export interface UpdateStandaloneTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  /** Passar string ISO marca conclusão; null limpa (volta a pendente). */
  completedAt?: string | null;
  priority?: TaskPriority;
  parentId?: string | null;
  notebookId?: string | null;
  position?: number;
  tags?: Tag[];
}

export type StandaloneTaskEvents = {
  inserted: StandaloneTask;
  updated: { old: StandaloneTask; new: StandaloneTask };
  removed: StandaloneTask;
};

export interface IStandaloneTaskRepository {
  list(): Promise<StandaloneTask[]>;
  get(id: string): Promise<StandaloneTask | null>;
  create(input: CreateStandaloneTaskInput): Promise<StandaloneTask>;
  update(
    id: string,
    input: UpdateStandaloneTaskInput
  ): Promise<StandaloneTask>;
  delete(id: string): Promise<void>;

  on<K extends keyof StandaloneTaskEvents>(
    event: K,
    cb: (data: StandaloneTaskEvents[K]) => void
  ): () => void;
  off<K extends keyof StandaloneTaskEvents>(
    event: K,
    cb: (data: StandaloneTaskEvents[K]) => void
  ): void;
}
