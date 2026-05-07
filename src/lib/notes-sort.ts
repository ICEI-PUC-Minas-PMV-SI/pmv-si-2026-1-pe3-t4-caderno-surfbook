import { storage } from "@/lib/storage";

/**
 * Persistência de preferência de ordenação **por caderno** em localStorage.
 *
 * Cada caderno lembra a ordem que o usuário escolheu — útil pra cenários
 * como "no caderno de aula sigo a ordem de criação, no de tarefas vejo
 * por atualização recente". Sem isso, todo reload reseta pra o default.
 */

export type SortOption = "updated" | "created" | "position" | "title";

const PREFIX = "notes-sort";
const VALID: ReadonlySet<string> = new Set([
  "updated",
  "created",
  "position",
  "title",
]);

function key(notebookId: string): string {
  return `${PREFIX}:${notebookId}`;
}

export function getSavedSort(notebookId: string): SortOption | null {
  if (!notebookId) return null;
  const value = storage.get<string | null>(key(notebookId), null);
  if (typeof value === "string" && VALID.has(value)) {
    return value as SortOption;
  }
  return null;
}

export function saveSort(notebookId: string, option: SortOption): void {
  if (!notebookId) return;
  storage.set(key(notebookId), option);
}
