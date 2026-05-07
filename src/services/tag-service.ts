import { Emitter } from "@/lib/emitter";

import { noteService } from "./note-service";
import { notebookService } from "./notebook-service";
import type { Tag } from "@/types/tag";

type TagServiceEvents = {
  /** Lista atualizada — emitido sempre que o índice muda. */
  changed: Tag[];
};

/**
 * Índice em memória de todas as tags do usuário, populado via eventos
 * vindos de `notebookService` e `noteService` (registrados em
 * `lib/app-bootstrap.ts`).
 *
 * Substitui a versão pull-based (que reagregava em cada chamada) pela
 * mesma lógica do eixo-1: cada client tem listeners e mantém side-effects
 * sincronizados (`MockNotebookClient.on("insert", ...)`).
 *
 * Fonte de verdade continua sendo `notebook.tags` / `note.tags` inline.
 * Este índice é uma projeção derivada — pode ser reconstruído a qualquer
 * momento via `refresh()` lendo das fontes.
 */
class TagService extends Emitter<TagServiceEvents> {
  private byNameLower = new Map<string, Tag>();
  private initialized = false;
  private refreshing: Promise<void> | null = null;

  async listAll(): Promise<Tag[]> {
    if (!this.initialized) await this.refresh();
    return Array.from(this.byNameLower.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  async refresh(): Promise<void> {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const [notebooks, notes] = await Promise.all([
        notebookService.list(),
        noteService.listAll(),
      ]);
      const next = new Map<string, Tag>();
      for (const nb of notebooks) {
        for (const tag of nb.tags ?? []) {
          const key = tag.name.toLowerCase();
          if (!next.has(key)) next.set(key, tag);
        }
      }
      for (const note of notes) {
        for (const tag of note.tags ?? []) {
          const key = tag.name.toLowerCase();
          if (!next.has(key)) next.set(key, tag);
        }
      }
      this.byNameLower = next;
      this.initialized = true;
      this.emit("changed", Array.from(this.byNameLower.values()));
    })();
    try {
      await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }

  /**
   * Side effect handler genérico — adiciona tags novas ao índice (não remove).
   * Usado pelo bootstrap a partir de eventos de notebooks e notas.
   */
  upsertTags(tags: Tag[] | undefined): void {
    if (!tags || tags.length === 0) return;
    let changed = false;
    for (const tag of tags) {
      const key = tag.name.toLowerCase();
      if (!this.byNameLower.has(key)) {
        this.byNameLower.set(key, tag);
        changed = true;
      }
    }
    if (changed) {
      this.emit("changed", Array.from(this.byNameLower.values()));
    }
  }

  /** Reset do estado — útil em logout. */
  clear(): void {
    this.byNameLower.clear();
    this.initialized = false;
    this.emit("changed", []);
  }
}

export const tagService = new TagService();
