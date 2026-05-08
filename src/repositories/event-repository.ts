import type { Tag } from "@/types/tag";

/**
 * Repositório de **eventos standalone** — registros de calendário que não
 * pertencem a uma `Note` ou `Notebook`. Lembretes pessoais ("prova", "consulta")
 * que existem por si só.
 *
 * Note que o `eventService` faz o agregador: combina eventos derivados
 * (notebook.dueDate / note.dueDate) com os standalone aqui pra exibir no
 * calendário. Cada entidade continua dona da sua data — esta é só mais uma
 * fonte.
 */

export type EventPriority = "high" | "medium" | "low";

export interface StandaloneEvent {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  /** ISO yyyy-mm-dd. */
  startDate: string;
  /** ISO yyyy-mm-dd. Igual a startDate quando evento de um dia só. */
  endDate: string;
  allDay: boolean;
  priority?: EventPriority;
  /** ISO datetime — marca conclusão. Eventos têm data por definição, então
   *  todos podem ser "cumpridos" e aparecem na view de tarefas. */
  completedAt?: string;
  /** Opcional. Quando setado, evento aparece também no calendário do caderno. */
  notebookId?: string;
  /** Tags compartilhadas com outras entidades (cadernos, notas, tarefas). */
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStandaloneEventInput {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  priority?: EventPriority;
  notebookId?: string;
  tags?: Tag[];
}

export interface UpdateStandaloneEventInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  priority?: EventPriority;
  /** null limpa a conclusão; string ISO marca como cumprido. */
  completedAt?: string | null;
  /** null limpa a associação; undefined preserva. */
  notebookId?: string | null;
  tags?: Tag[];
}

export type StandaloneEventEvents = {
  inserted: StandaloneEvent;
  updated: { old: StandaloneEvent; new: StandaloneEvent };
  removed: StandaloneEvent;
};

export interface IStandaloneEventRepository {
  list(): Promise<StandaloneEvent[]>;
  get(id: string): Promise<StandaloneEvent | null>;
  create(input: CreateStandaloneEventInput): Promise<StandaloneEvent>;
  update(
    id: string,
    input: UpdateStandaloneEventInput
  ): Promise<StandaloneEvent>;
  delete(id: string): Promise<void>;

  on<K extends keyof StandaloneEventEvents>(
    event: K,
    cb: (data: StandaloneEventEvents[K]) => void
  ): () => void;
  off<K extends keyof StandaloneEventEvents>(
    event: K,
    cb: (data: StandaloneEventEvents[K]) => void
  ): void;
}
