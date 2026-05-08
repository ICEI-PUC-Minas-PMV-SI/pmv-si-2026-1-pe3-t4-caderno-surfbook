import { colorForTagName } from "@/components/ui/tag-selector/tag-selector";
import { eventService } from "@/services/event-service";
import { noteService } from "@/services/note-service";
import { notebookService } from "@/services/notebook-service";
import { taskService } from "@/services/task-service";
import type { NoteNode } from "@/types/note-node";

/**
 * **Grafo de conhecimento** — porta o `parseToGraphNodes` do eixo-1 e estende
 * pra todas as 5 entidades novas (caderno, nota, tarefa, evento, tag).
 *
 * Source-of-truth das relações vem dos services existentes — service compõe,
 * não persiste. Reatividade idêntica ao calendário/tarefas: `subscribe(cb)`
 * agrega emitters de todas as fontes.
 *
 * Tipo de aresta:
 * - Caderno → Nota/Tarefa/Evento (containment)
 * - Caderno/Nota/Tarefa/Evento ↔ Tag (afinidade conceitual)
 * - Nota → Nota/Caderno/Bloco (referências internas via `bookmark` e
 *   `[texto](surfbook://...)`)
 */

export type GraphNodeType =
  | "notebook"
  | "note"
  | "task"
  | "event"
  | "tag";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  /** Id da entidade origem sem prefixo (notebookId/noteId/taskId/eventId/tag.name lower). */
  sourceId: string;
  label: string;
  /** Cor hex/css do nó. Default por tipo, customizada quando entidade tem cor. */
  color: string;
  /** Caderno ao qual o nó pertence (quando aplicável) — herda cor do caderno. */
  notebookId?: string;
  /** Quantidade de arestas conectadas — usado pra dimensionar (degree centrality). */
  weight: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphFilters {
  showNotebooks?: boolean;
  showNotes?: boolean;
  showTasks?: boolean;
  showEvents?: boolean;
  showTags?: boolean;
  /** Filtra só entidades de um caderno específico (e suas tags). */
  notebookId?: string;
  /**
   * Modo de coloração:
   * - `type` (default): cor por tipo (caderno=indigo, nota=amber, etc.) —
   *   prioriza distinguir tipos no glance
   * - `notebook`: caderno tem cor única por nome; notas/tarefas/eventos do
   *   mesmo caderno herdam a cor — prioriza ver agrupamento por caderno
   */
  colorMode?: "type" | "notebook";
  /**
   * Query rica — combinação de tokens separados por espaço:
   * - `#tag` ou `tag:nome` → entidades que tenham essa tag (e o nó da tag)
   * - `-#tag` → exclui entidades com essa tag
   * - `tipo:caderno|nota|tarefa|evento|tag` → restringe ao tipo
   * - `caderno:nome` → escopo no caderno indicado (case-insensitive substring)
   * - texto solto → substring match no label do nó (case-insensitive)
   *
   * Múltiplos tokens são AND. Tags com `OR` ficam pra v2.
   */
  query?: string;
}

interface ParsedQuery {
  textTerms: string[];
  requiredTags: string[];
  excludedTags: string[];
  notebookNames: string[];
  typeFilters: GraphNodeType[];
}

const TYPE_ALIASES: Record<string, GraphNodeType> = {
  caderno: "notebook",
  notebook: "notebook",
  nota: "note",
  note: "note",
  tarefa: "task",
  task: "task",
  evento: "event",
  event: "event",
  tag: "tag",
};

function parseQuery(query: string | undefined): ParsedQuery {
  const out: ParsedQuery = {
    textTerms: [],
    requiredTags: [],
    excludedTags: [],
    notebookNames: [],
    typeFilters: [],
  };
  if (!query) return out;
  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  for (const raw of tokens) {
    const tok = raw.replace(/^"|"$/g, "");
    const negated = tok.startsWith("-");
    const body = negated ? tok.slice(1) : tok;
    if (!body) continue;
    if (body.startsWith("#")) {
      const name = body.slice(1).toLowerCase();
      if (negated) out.excludedTags.push(name);
      else out.requiredTags.push(name);
    } else if (body.includes(":")) {
      const [key, ...rest] = body.split(":");
      const value = rest.join(":").toLowerCase();
      if (!value) continue;
      const k = key.toLowerCase();
      if (k === "tag") {
        if (negated) out.excludedTags.push(value);
        else out.requiredTags.push(value);
      } else if (k === "tipo" || k === "type") {
        const t = TYPE_ALIASES[value];
        if (t) out.typeFilters.push(t);
      } else if (k === "caderno" || k === "notebook") {
        out.notebookNames.push(value);
      } else {
        out.textTerms.push(body.toLowerCase());
      }
    } else {
      out.textTerms.push(body.toLowerCase());
    }
  }
  return out;
}

// Cor base por tipo (matched com o resto da app)
const TYPE_COLOR: Record<GraphNodeType, string> = {
  notebook: "#6366f1", // brand-500
  note: "#d97706", // amber-600
  task: "#10b981", // emerald-500
  event: "#8b5cf6", // violet-500
  tag: "#94a3b8", // slate-400
};

/**
 * Extrai surfbook:// targets de nodes de uma nota — usados pra criar arestas
 * de referência entre notas/cadernos/blocos.
 */
function extractInternalRefs(
  nodes: NoteNode[]
): { kind: "notebook" | "note" | "node"; ids: string[] }[] {
  const refs: { kind: "notebook" | "note" | "node"; ids: string[] }[] = [];
  // Padrão markdown link: [label](surfbook://kind/...)
  const linkRe = /\[[^\]]+\]\(surfbook:\/\/([^)]+)\)/g;

  function consume(text: string) {
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      const path = m[1].split("/").filter(Boolean);
      const kind = path[0];
      if (kind === "notebook" && path[1]) {
        refs.push({ kind: "notebook", ids: [path[1]] });
      } else if (kind === "note" && path[1] && path[2]) {
        refs.push({ kind: "note", ids: [path[1], path[2]] });
      } else if (kind === "node" && path[1] && path[2] && path[3]) {
        refs.push({ kind: "node", ids: [path[1], path[2], path[3]] });
      }
    }
  }

  for (const n of nodes) {
    if (n.type === "heading" || n.type === "paragraph" || n.type === "quote") {
      consume(n.text);
    } else if (n.type === "list") {
      for (const it of n.items) consume(it.text);
    } else if (n.type === "checklist") {
      for (const it of n.items) consume(it.text);
    } else if (n.type === "bookmark" && n.ref) {
      // Bloco bookmark é referência explícita
      if (n.ref.kind === "notebook") {
        refs.push({ kind: "notebook", ids: [n.ref.notebookId] });
      } else if (n.ref.kind === "note") {
        refs.push({ kind: "note", ids: [n.ref.notebookId, n.ref.noteId] });
      } else if (n.ref.kind === "node") {
        refs.push({
          kind: "node",
          ids: [n.ref.notebookId, n.ref.noteId, n.ref.nodeId],
        });
      }
    }
  }

  return refs;
}

/**
 * Constrói o grafo a partir do estado atual dos repos. Filtros decidem quais
 * tipos entram. Pesos são contagem de arestas.
 */
export const graphService = {
  async build(filters: GraphFilters = {}): Promise<GraphData> {
    const {
      showNotebooks = true,
      showNotes = true,
      showTasks = true,
      showEvents = true,
      showTags = true,
      notebookId: scopedNotebookId,
      colorMode = "type",
      query,
    } = filters;

    const [notebooks, notes, tasks, events] = await Promise.all([
      notebookService.list(),
      noteService.listAll(),
      taskService.listStandalone(),
      eventService.listStandalone(),
    ]);

    const parsed = parseQuery(query);

    // Resolve notebookNames do query → set de ids
    const queryNotebookIds = new Set<string>();
    if (parsed.notebookNames.length > 0) {
      for (const nb of notebooks) {
        const nameLower = nb.name.toLowerCase();
        if (parsed.notebookNames.some((q) => nameLower.includes(q))) {
          queryNotebookIds.add(nb.id);
        }
      }
    }
    const hasNotebookScope =
      !!scopedNotebookId || queryNotebookIds.size > 0;
    function inNotebookScope(id: string | undefined): boolean {
      if (!hasNotebookScope) return true;
      if (scopedNotebookId && id !== scopedNotebookId) return false;
      if (queryNotebookIds.size > 0 && (!id || !queryNotebookIds.has(id))) {
        return false;
      }
      return true;
    }

    // Filtros de tipo do query
    const typeAllowed = (t: GraphNodeType): boolean => {
      if (parsed.typeFilters.length === 0) return true;
      return parsed.typeFilters.includes(t);
    };

    // Predicado de entidade — aplica text/tag/excluded/scope
    function entityPasses(
      label: string,
      tags: { name: string }[] | undefined,
      notebookIdOfEntity: string | undefined
    ): boolean {
      if (!inNotebookScope(notebookIdOfEntity)) return false;
      const tagSet = new Set(
        (tags ?? []).map((t) => t.name.toLowerCase())
      );
      for (const req of parsed.requiredTags) {
        if (!tagSet.has(req)) return false;
      }
      for (const exc of parsed.excludedTags) {
        if (tagSet.has(exc)) return false;
      }
      const labelLower = label.toLowerCase();
      for (const term of parsed.textTerms) {
        if (!labelLower.includes(term)) return false;
      }
      return true;
    }

    // Aplica escopo + query nos visible*
    const visibleNotebooks = notebooks.filter(
      (nb) =>
        inNotebookScope(nb.id) && entityPasses(nb.name, nb.tags, nb.id)
    );
    const visibleNotes = notes.filter(
      (n) =>
        inNotebookScope(n.notebookId) &&
        entityPasses(n.title, n.tags, n.notebookId)
    );
    const visibleTasks = tasks.filter(
      (t) =>
        inNotebookScope(t.notebookId) &&
        entityPasses(t.title, t.tags, t.notebookId)
    );
    const visibleEvents = events.filter(
      (e) =>
        inNotebookScope(e.notebookId) &&
        entityPasses(e.name, e.tags, e.notebookId)
    );

    const nodes = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    function addLink(source: string, target: string) {
      if (!nodes.has(source) || !nodes.has(target)) return;
      if (source === target) return;
      links.push({ source, target });
      nodes.get(source)!.weight++;
      nodes.get(target)!.weight++;
    }

    // ---------- Notebooks ----------
    // Em modo "notebook", cada caderno tem cor única (hash do nome) e seus
    // filhos herdam — fica fácil identificar a "família". Em modo "type",
    // todos os cadernos compartilham TYPE_COLOR.notebook (= legenda).
    const notebookColor = new Map<string, string>();
    for (const nb of visibleNotebooks) {
      const id = `notebook-${nb.id}`;
      const color =
        colorMode === "notebook"
          ? colorForTagName(nb.name || nb.id)
          : TYPE_COLOR.notebook;
      notebookColor.set(nb.id, color);
      if (showNotebooks && typeAllowed("notebook")) {
        nodes.set(id, {
          id,
          type: "notebook",
          sourceId: nb.id,
          label: nb.name || "Sem nome",
          color,
          notebookId: nb.id,
          weight: 1,
        });
      }
    }

    function colorFor(
      type: GraphNodeType,
      notebookIdOfEntity: string | undefined
    ): string {
      if (colorMode === "notebook" && notebookIdOfEntity) {
        return notebookColor.get(notebookIdOfEntity) ?? TYPE_COLOR[type];
      }
      return TYPE_COLOR[type];
    }

    // ---------- Notes ----------
    for (const n of visibleNotes) {
      const id = `note-${n.id}`;
      if (showNotes && typeAllowed("note")) {
        nodes.set(id, {
          id,
          type: "note",
          sourceId: n.id,
          label: n.title || "Sem título",
          color: colorFor("note", n.notebookId),
          notebookId: n.notebookId,
          weight: 1,
        });
      }
      // Aresta de containment (caderno → nota)
      if (showNotes && showNotebooks) {
        addLink(`notebook-${n.notebookId}`, id);
      }
    }

    // ---------- Tasks (standalone) ----------
    for (const t of visibleTasks) {
      const id = `task-${t.id}`;
      if (showTasks && typeAllowed("task")) {
        nodes.set(id, {
          id,
          type: "task",
          sourceId: t.id,
          label: t.title || "Sem título",
          color: colorFor("task", t.notebookId),
          notebookId: t.notebookId,
          weight: 1,
        });
      }
      // Aresta opcional caderno → task
      if (showTasks && showNotebooks && t.notebookId) {
        addLink(`notebook-${t.notebookId}`, id);
      }
      // Aresta task → task (parent)
      if (showTasks && t.parentId) {
        addLink(`task-${t.parentId}`, id);
      }
    }

    // ---------- Events (standalone) ----------
    for (const e of visibleEvents) {
      const id = `event-${e.id}`;
      if (showEvents && typeAllowed("event")) {
        nodes.set(id, {
          id,
          type: "event",
          sourceId: e.id,
          label: e.name || "Sem nome",
          color: colorFor("event", e.notebookId),
          notebookId: e.notebookId,
          weight: 1,
        });
      }
      if (showEvents && showNotebooks && e.notebookId) {
        addLink(`notebook-${e.notebookId}`, id);
      }
    }

    // ---------- Tags ----------
    if (showTags && typeAllowed("tag")) {
      type TagRef = { name: string; color: string; sources: string[] };
      const tagRefs = new Map<string, TagRef>();
      function collect(tags: { name: string; color: string }[], sourceId: string) {
        for (const tag of tags) {
          const key = `tag-${tag.name.toLowerCase()}`;
          const ref = tagRefs.get(key) ?? {
            name: tag.name,
            color: tag.color,
            sources: [],
          };
          ref.sources.push(sourceId);
          tagRefs.set(key, ref);
        }
      }
      for (const nb of visibleNotebooks) {
        if (showNotebooks) collect(nb.tags ?? [], `notebook-${nb.id}`);
      }
      for (const n of visibleNotes) {
        if (showNotes) collect(n.tags ?? [], `note-${n.id}`);
      }
      for (const t of visibleTasks) {
        if (showTasks) collect(t.tags ?? [], `task-${t.id}`);
      }
      for (const e of visibleEvents) {
        if (showEvents) collect(e.tags ?? [], `event-${e.id}`);
      }

      for (const [tagId, ref] of tagRefs) {
        if (ref.sources.length === 0) continue;
        nodes.set(tagId, {
          id: tagId,
          type: "tag",
          sourceId: ref.name.toLowerCase(),
          label: ref.name,
          color: ref.color,
          weight: ref.sources.length,
        });
        for (const src of ref.sources) addLink(src, tagId);
      }
    }

    // ---------- Cross-references entre notas (links internos) ----------
    if (showNotes) {
      for (const n of visibleNotes) {
        const fromId = `note-${n.id}`;
        if (!nodes.has(fromId)) continue;
        const refs = extractInternalRefs(n.nodes ?? []);
        for (const ref of refs) {
          let targetId: string | null = null;
          if (ref.kind === "notebook") {
            targetId = `notebook-${ref.ids[0]}`;
          } else if (ref.kind === "note" || ref.kind === "node") {
            // Apontamos pra nota; bloco interno fica no metadata da rota
            targetId = `note-${ref.ids[1]}`;
          }
          if (targetId && nodes.has(targetId)) {
            addLink(fromId, targetId);
          }
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      links,
    };
  },

  /** Subscreve mudanças nas 4 fontes — refaz o grafo quando algo muda. */
  subscribe(cb: () => void): () => void {
    const offs: Array<() => void> = [];
    offs.push(notebookService.on("inserted", () => cb()));
    offs.push(notebookService.on("updated", () => cb()));
    offs.push(notebookService.on("removed", () => cb()));
    offs.push(noteService.on("inserted", () => cb()));
    offs.push(noteService.on("updated", () => cb()));
    offs.push(noteService.on("removed", () => cb()));
    offs.push(taskService.onStandalone("inserted", () => cb()));
    offs.push(taskService.onStandalone("updated", () => cb()));
    offs.push(taskService.onStandalone("removed", () => cb()));
    offs.push(eventService.onStandalone("inserted", () => cb()));
    offs.push(eventService.onStandalone("updated", () => cb()));
    offs.push(eventService.onStandalone("removed", () => cb()));
    return () => {
      for (const off of offs) off();
    };
  },
};
