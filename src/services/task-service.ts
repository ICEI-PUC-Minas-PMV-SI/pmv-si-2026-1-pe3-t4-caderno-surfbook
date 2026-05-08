import { isApiEnabled } from "@/lib/api";
import { MockStandaloneTaskRepository } from "@/repositories/mock/mock-task-repository";
import type {
  IStandaloneTaskRepository,
  StandaloneTask,
  StandaloneTaskEvents,
  TaskPriority,
} from "@/repositories/task-repository";
import {
  eventService,
  type StandaloneEvent,
} from "@/services/event-service";
import { noteService, type Note } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

/**
 * **Tarefas** no eixo-3 espelha o pattern do calendário: agregador de
 * múltiplas fontes num feed unificado, exibido como **checklist multi-nível**
 * (não Kanban — decisão deliberada do produto).
 *
 * Fontes:
 * 1. **Standalone** — `StandaloneTask`, hierárquica (parentId/level), com
 *    repo próprio.
 * 2. **Derivado de Notebook** — caderno com `dueDate` vira task `notebook-<id>`
 *    no nível 0; marcação de conclusão grava `completedAt` no Notebook.
 * 3. **Derivado de Note** — nota com `dueDate` vira task `note-<id>` no nível
 *    0; marcação grava `completedAt` na Note.
 *
 * Reatividade: `subscribe(cb)` compõe os 3 emitters. Marcar uma derivada como
 * concluída atualiza a entidade origem (notebook/note) — o emitter dela
 * dispara, e qualquer view escutando se atualiza naturalmente.
 */

const standaloneRepo: IStandaloneTaskRepository = isApiEnabled
  ? (() => {
      throw new Error(
        "ApiStandaloneTaskRepository ainda não implementado — backend real fora do escopo do eixo-3."
      );
    })()
  : new MockStandaloneTaskRepository();

import type { Tag } from "@/types/tag";

export interface TaskItem {
  /** Id sintético: `task-<id>`, `notebook-<id>`, `note-<id>`, `event-<id>` ou
   *  `clitem-<id>` (checklist item). */
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  priority?: TaskPriority;
  /** Nivel de indentação na árvore. Calculado pelo render. */
  level: number;
  /** Posição entre irmãos do mesmo parent. Derivadas sortam por dueDate. */
  position: number;
  parentId?: string;
  parentType: "task" | "notebook" | "note" | "event" | "checklist-item";
  /** Id da entidade de origem (sem prefixo). */
  sourceId: string;
  notebookId?: string;
  /** Para checklist-item: id da nota onde o item vive (necessário pra toggle). */
  noteId?: string;
  /** Tags da entidade origem (não set para checklist-item). */
  tags?: Tag[];
  /**
   * Caderno OU nota que existe só pra agrupar filhos (não tem `dueDate`
   * próprio). Renderiza como header de seção, sem checkbox e sem toggle.
   */
  isSeparator?: boolean;
}

/**
 * Converte os 4 tipos de fonte em `TaskItem`. O `parentId` aqui já usa o id
 * sintético (ex.: `notebook-<id>`) pra que o agregador construa a árvore
 * uniformemente sem cada renderizador precisar saber das regras de mapeamento.
 *
 * Regras de parentage virtual:
 * - Standalone task com `parentId` próprio → child da task pai (mesmo grupo)
 * - Standalone task sem parent mas com `notebookId` → child do caderno
 * - Note com `dueDate` → child do caderno
 * - Event com `notebookId` → child do caderno
 * - Caderno: root sempre
 */

function fromStandalone(t: StandaloneTask): TaskItem {
  const parentId = t.parentId
    ? `task-${t.parentId}`
    : t.notebookId
      ? `notebook-${t.notebookId}`
      : undefined;
  return {
    id: `task-${t.id}`,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate,
    completedAt: t.completedAt,
    priority: t.priority,
    level: 0, // recalculado no render via tree
    position: t.position,
    parentId,
    parentType: "task",
    sourceId: t.id,
    notebookId: t.notebookId,
    tags: t.tags,
  };
}

function fromNotebook(nb: Notebook, isSeparator: boolean): TaskItem {
  return {
    id: `notebook-${nb.id}`,
    title: nb.name || "Caderno sem nome",
    description: nb.description || undefined,
    dueDate: nb.dueDate,
    completedAt: nb.completedAt,
    level: 0,
    position: 0,
    parentType: "notebook",
    sourceId: nb.id,
    notebookId: nb.id,
    tags: nb.tags,
    isSeparator,
  };
}

function fromNote(n: Note, isSeparator: boolean): TaskItem {
  return {
    id: `note-${n.id}`,
    title: n.title || "Nota sem título",
    dueDate: n.dueDate,
    completedAt: n.completedAt,
    level: 0,
    position: 0,
    parentId: `notebook-${n.notebookId}`,
    parentType: "note",
    sourceId: n.id,
    notebookId: n.notebookId,
    noteId: n.id,
    tags: n.tags,
    isSeparator,
  };
}

/**
 * Itens de checklist viram tasks. A árvore vem do `indent`: um item indent N
 * é filho do último item indent N-1 acima. parentId aponta pra esse item ou,
 * em indent 0, pra própria nota.
 */
function checklistTasksFromNote(n: Note): TaskItem[] {
  const out: TaskItem[] = [];
  for (const node of n.nodes) {
    if (node.type !== "checklist") continue;
    // Pilha por indent — cada slot guarda o id do último item nesse nível
    const stack: (string | undefined)[] = [];
    for (let i = 0; i < node.items.length; i++) {
      const it = node.items[i];
      const parentTaskId =
        it.indent > 0 && stack[it.indent - 1]
          ? stack[it.indent - 1]
          : `note-${n.id}`;
      const taskId = `clitem-${it.id}`;
      out.push({
        id: taskId,
        title: it.text || "Item vazio",
        completedAt: it.checked ? n.updatedAt : undefined,
        level: 0,
        position: i,
        parentId: parentTaskId,
        parentType: "checklist-item",
        sourceId: it.id,
        notebookId: n.notebookId,
        noteId: n.id,
      });
      stack[it.indent] = taskId;
      // Limpa níveis abaixo (sub-árvores que terminaram)
      stack.length = it.indent + 1;
    }
  }
  return out;
}

function fromEvent(e: StandaloneEvent): TaskItem {
  return {
    id: `event-${e.id}`,
    title: e.name,
    description: e.description,
    dueDate: e.startDate,
    completedAt: e.completedAt,
    priority: e.priority,
    level: 0,
    position: 0,
    parentId: e.notebookId ? `notebook-${e.notebookId}` : undefined,
    parentType: "event",
    sourceId: e.id,
    notebookId: e.notebookId,
    tags: e.tags,
  };
}

export const taskService = {
  // ---------------- CRUD on standalone ----------------
  listStandalone: () => standaloneRepo.list(),
  getStandalone: (id: string) => standaloneRepo.get(id),
  createStandalone: (
    input: Parameters<IStandaloneTaskRepository["create"]>[0]
  ) => standaloneRepo.create(input),
  updateStandalone: (
    id: string,
    input: Parameters<IStandaloneTaskRepository["update"]>[1]
  ) => standaloneRepo.update(id, input),
  deleteStandalone: (id: string) => standaloneRepo.delete(id),

  onStandalone: <K extends keyof StandaloneTaskEvents>(
    event: K,
    cb: (data: StandaloneTaskEvents[K]) => void
  ) => standaloneRepo.on(event, cb),

  // ---------------- Aggregated feed ----------------

  async listAll(): Promise<TaskItem[]> {
    const [notebooks, notes, standalones, events] = await Promise.all([
      notebookService.list(),
      noteService.listAll(),
      standaloneRepo.list(),
      eventService.listStandalone(),
    ]);

    // Cache de items de checklist por nota (evita refazer a varredura)
    const checklistByNote = new Map<string, TaskItem[]>();
    function getChecklistItems(n: Note): TaskItem[] {
      const cached = checklistByNote.get(n.id);
      if (cached) return cached;
      const items = checklistTasksFromNote(n);
      checklistByNote.set(n.id, items);
      return items;
    }

    function noteHasChildren(n: Note): boolean {
      return getChecklistItems(n).length > 0;
    }

    // Conta filhos por caderno (notas, eventos, standalones, OU notas que tem
    // checklist com items — mesmo sem dueDate elas viram pais virtuais).
    const childrenCount = new Map<string, number>();
    function bump(notebookId: string | undefined) {
      if (!notebookId) return;
      childrenCount.set(notebookId, (childrenCount.get(notebookId) ?? 0) + 1);
    }
    for (const n of notes) {
      if (n.dueDate || noteHasChildren(n)) bump(n.notebookId);
    }
    for (const ev of events) bump(ev.notebookId);
    for (const s of standalones) bump(s.notebookId);

    const out: TaskItem[] = [];

    // Notebooks: emite se tem dueDate (= task real) OU tem filhos (= separador)
    for (const nb of notebooks) {
      const hasChildren = (childrenCount.get(nb.id) ?? 0) > 0;
      if (nb.dueDate) {
        out.push(fromNotebook(nb, false));
      } else if (hasChildren) {
        out.push(fromNotebook(nb, true));
      }
    }

    // Notas: emite se tem dueDate (= task) OU tem checklist items (= separador)
    for (const n of notes) {
      const hasChecklistItems = noteHasChildren(n);
      if (n.dueDate) {
        out.push(fromNote(n, false));
      } else if (hasChecklistItems) {
        out.push(fromNote(n, true));
      }
      // Items de checklist viram tasks filhas da nota
      for (const t of getChecklistItems(n)) out.push(t);
    }

    for (const ev of events) {
      out.push(fromEvent(ev));
    }
    for (const s of standalones) {
      out.push(fromStandalone(s));
    }
    return out;
  },

  async listByNotebook(notebookId: string): Promise<TaskItem[]> {
    const all = await this.listAll();
    // Filtra pelo notebookId E exclui o item do próprio caderno (a página já é
    // o contexto do caderno — o header do caderno como task seria redundante).
    return all.filter(
      (t) =>
        t.notebookId === notebookId &&
        !(t.parentType === "notebook" && t.sourceId === notebookId)
    );
  },

  /**
   * Marca/desmarca conclusão de qualquer task — derivada ou standalone.
   * Para derivadas, atualiza `completedAt` na entidade origem; o emitter
   * dela é que dispara o reload nas views. No-op em separadores.
   */
  async toggleCompleted(item: TaskItem): Promise<void> {
    if (item.isSeparator) return;
    const completedAt = item.completedAt ? null : new Date().toISOString();
    if (item.parentType === "task") {
      await standaloneRepo.update(item.sourceId, { completedAt });
    } else if (item.parentType === "notebook") {
      await notebookService.update(item.sourceId, { completedAt });
    } else if (item.parentType === "note") {
      await noteService.update(item.sourceId, { completedAt });
    } else if (item.parentType === "event") {
      await eventService.updateStandalone(item.sourceId, { completedAt });
    } else if (item.parentType === "checklist-item" && item.noteId) {
      // Atualiza o item dentro do nodes da nota e re-salva a nota inteira.
      // O emitter de note dispara, view se atualiza naturalmente.
      const note = await noteService.get(item.noteId);
      if (!note) return;
      const itemId = item.sourceId;
      const targetChecked = !item.completedAt;
      const newNodes = note.nodes.map((node) => {
        if (node.type !== "checklist") return node;
        if (!node.items.some((it) => it.id === itemId)) return node;
        return {
          ...node,
          items: node.items.map((it) =>
            it.id === itemId ? { ...it, checked: targetChecked } : it
          ),
        };
      });
      await noteService.update(item.noteId, { nodes: newNodes });
    }
  },

  /** Inscreve callback em qualquer mudança nas 3 fontes. */
  subscribe(cb: () => void): () => void {
    const offs: Array<() => void> = [];
    offs.push(notebookService.on("inserted", () => cb()));
    offs.push(notebookService.on("updated", () => cb()));
    offs.push(notebookService.on("removed", () => cb()));
    offs.push(noteService.on("inserted", () => cb()));
    offs.push(noteService.on("updated", () => cb()));
    offs.push(noteService.on("removed", () => cb()));
    offs.push(standaloneRepo.on("inserted", () => cb()));
    offs.push(standaloneRepo.on("updated", () => cb()));
    offs.push(standaloneRepo.on("removed", () => cb()));
    offs.push(eventService.onStandalone("inserted", () => cb()));
    offs.push(eventService.onStandalone("updated", () => cb()));
    offs.push(eventService.onStandalone("removed", () => cb()));
    return () => {
      for (const off of offs) off();
    };
  },
};

export type {
  CreateStandaloneTaskInput,
  StandaloneTask,
  TaskPriority,
  UpdateStandaloneTaskInput,
} from "@/repositories/task-repository";
