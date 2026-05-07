import { isApiEnabled } from "@/lib/api";
import type {
  INotebookRepository,
  NotebookEvents,
} from "@/repositories/notebook-repository";
import { MockNotebookRepository } from "@/repositories/mock/mock-notebook-repository";

const repo: INotebookRepository = isApiEnabled
  ? (() => {
      throw new Error(
        "ApiNotebookRepository ainda não implementado — backend real fora do escopo do eixo-3."
      );
    })()
  : new MockNotebookRepository();

export const notebookService = {
  list: () => repo.list(),
  get: (id: string) => repo.get(id),
  create: (input: Parameters<INotebookRepository["create"]>[0]) =>
    repo.create(input),
  update: (
    id: string,
    input: Parameters<INotebookRepository["update"]>[1]
  ) => repo.update(id, input),
  delete: (id: string) => repo.delete(id),

  on: <K extends keyof NotebookEvents>(
    event: K,
    cb: (data: NotebookEvents[K]) => void
  ) => repo.on(event, cb),
  off: <K extends keyof NotebookEvents>(
    event: K,
    cb: (data: NotebookEvents[K]) => void
  ) => repo.off(event, cb),
};

export type {
  CreateNotebookInput,
  Notebook,
  NotebookEvents,
  UpdateNotebookInput,
} from "@/repositories/notebook-repository";
export type { Tag } from "@/types/tag";
