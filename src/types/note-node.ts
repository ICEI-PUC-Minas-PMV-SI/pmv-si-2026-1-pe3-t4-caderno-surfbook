/**
 * NoteNode — bloco tipado dentro de uma nota.
 *
 * Modelo replica o "amontoado de nodes" do eixo-1 (`MockContentNodesClient`)
 * mas usa discriminated union do TypeScript em vez de `{type, value}` com
 * separador `\t`. Mais seguro pra refactor e mais idiomático em TS.
 *
 * Toda nota é uma sequência ordenada de nodes (via `position`). MD é
 * gerado/parseado a partir desse formato em `lib/markdown-nodes.ts`.
 */

interface NoteNodeBase {
  id: string;
  position: number;
}

export type HeadingNode = NoteNodeBase & {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
};

export type ParagraphNode = NoteNodeBase & {
  type: "paragraph";
  text: string;
};

export type ListItem = {
  text: string;
  /** Profundidade de indentação (0 = topo). Tab incrementa, Shift+Tab decrementa. */
  indent: number;
};

export type ListNode = NoteNodeBase & {
  type: "list";
  ordered: boolean;
  items: ListItem[];
};

export type ChecklistItem = {
  /** UUID estável — necessário pra referenciar como task no agregador. */
  id: string;
  checked: boolean;
  text: string;
  indent: number;
};

export type ChecklistNode = NoteNodeBase & {
  type: "checklist";
  ordered: boolean;
  items: ChecklistItem[];
};

export type ImageNode = NoteNodeBase & {
  type: "image";
  url: string;
  alt?: string;
};

export type QuoteNode = NoteNodeBase & {
  type: "quote";
  text: string;
};

export type CodeNode = NoteNodeBase & {
  type: "code";
  language?: string;
  code: string;
};

export type DividerNode = NoteNodeBase & {
  type: "divider";
};

/**
 * Referência interna pra outro objeto do app — porta do `bookmark-internal`
 * do eixo-1. Três variantes (notebook, note, node).
 *
 * `ref: null` = ainda não selecionado (estado inicial após inserir o bloco).
 */
export type BookmarkRef =
  | { kind: "notebook"; notebookId: string }
  | { kind: "note"; notebookId: string; noteId: string }
  | { kind: "node"; notebookId: string; noteId: string; nodeId: string };

export type BookmarkNode = NoteNodeBase & {
  type: "bookmark";
  ref: BookmarkRef | null;
};

export type NoteNode =
  | HeadingNode
  | ParagraphNode
  | ListNode
  | ChecklistNode
  | ImageNode
  | QuoteNode
  | CodeNode
  | DividerNode
  | BookmarkNode;

export type NoteNodeType = NoteNode["type"];

/** Tipo sem id e position — usado pelo parser antes de salvar. */
export type NoteNodeDraft =
  | Omit<HeadingNode, "id" | "position">
  | Omit<ParagraphNode, "id" | "position">
  | Omit<ListNode, "id" | "position">
  | Omit<ChecklistNode, "id" | "position">
  | Omit<ImageNode, "id" | "position">
  | Omit<QuoteNode, "id" | "position">
  | Omit<CodeNode, "id" | "position">
  | Omit<DividerNode, "id" | "position">
  | Omit<BookmarkNode, "id" | "position">;
