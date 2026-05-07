import { seedTutorialIfNeeded } from "@/lib/seed-tutorial";
import { noteService } from "@/services/note-service";
import { notebookService } from "@/services/notebook-service";
import { tagService } from "@/services/tag-service";

/**
 * Bootstrap central — replica o pattern do `app-load_surf_book.js` do eixo-1.
 *
 * Aqui registramos os efeitos colaterais cross-entidade. Ex.: quando um
 * caderno ou nota é criado/atualizado com tags, o índice de tags é mantido
 * em sincronia sem que o componente de UI precise saber dessa relação.
 *
 * Conforme novos repos surgirem (tasks, events, search index), este arquivo
 * cresce com novos `xService.on(...)`.
 */

let listenersRegistered = false;
let seededFor: string | null = null;

function registerListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  // Notebooks → tag index
  notebookService.on("inserted", (notebook) => {
    tagService.upsertTags(notebook.tags);
  });
  notebookService.on("updated", ({ new: notebook }) => {
    tagService.upsertTags(notebook.tags);
  });
  notebookService.on("removed", () => {
    // Tags do caderno removido podem continuar sendo usadas em outros cadernos
    // ou notas. Refresh agrega corretamente o estado pós-remoção.
    tagService.refresh();
  });

  // Notes → tag index
  noteService.on("inserted", (note) => {
    tagService.upsertTags(note.tags);
  });
  noteService.on("updated", ({ new: note }) => {
    tagService.upsertTags(note.tags);
  });
  noteService.on("removed", () => {
    tagService.refresh();
  });
}

/**
 * Inicialização por usuário — semeia o índice de tags com os dados existentes
 * e garante que os listeners estão registrados. Idempotente por usuário.
 */
export async function bootstrapForUser(userId: string): Promise<void> {
  registerListeners();

  if (seededFor === userId) return;
  seededFor = userId;

  // Onboarding implícito — cria caderno-tutorial se ainda não houver.
  // Idempotente: só semeia se o user não tem nenhum caderno `system: true`.
  await seedTutorialIfNeeded();

  await tagService.refresh();
}

/** Limpeza no logout — evita vazar dados entre usuários. */
export function teardownOnLogout(): void {
  seededFor = null;
  tagService.clear();
}
