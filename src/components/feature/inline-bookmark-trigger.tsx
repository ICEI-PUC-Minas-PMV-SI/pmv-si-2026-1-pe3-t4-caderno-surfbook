"use client";

import { BookOpen, FileText, Hash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getIconComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  noteService,
  type BookmarkRef,
  type Note,
  type NoteNode,
} from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

/**
 * Inline bookmark trigger — `[[` num input/textarea abre popover com busca.
 * Selecionando substitui `[[query` por `[label](surfbook://...)` no texto.
 *
 * Integra com text blocks (heading/paragraph/quote) via:
 * - `handleChange(value, cursor)` em vez de `onChange` direto
 * - `handleKeyDown(e)` retorna `true` se interceptou (popover navigation)
 * - Renderizar `<InlineBookmarkPopover>` dentro de um wrapper `relative`
 */

export interface PickerResult {
  id: string;
  label: string;
  meta: string;
  icon: React.ReactNode;
  ref: BookmarkRef;
}

function detectTrigger(
  text: string,
  cursor: number
): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const lastOpen = before.lastIndexOf("[[");
  if (lastOpen === -1) return null;
  const middle = before.slice(lastOpen + 2);
  // Trigger fica ativo se não tem `]` (fechando o link) nem newline depois do `[[`
  if (middle.includes("]") || middle.includes("\n")) return null;
  return { start: lastOpen, query: middle };
}

function buildLink(label: string, ref: BookmarkRef): string {
  let path: string;
  switch (ref.kind) {
    case "notebook":
      path = `notebook/${ref.notebookId}`;
      break;
    case "note":
      path = `note/${ref.notebookId}/${ref.noteId}`;
      break;
    case "node":
      path = `node/${ref.notebookId}/${ref.noteId}/${ref.nodeId}`;
      break;
  }
  return `[${label}](surfbook://${path})`;
}

function nodeLabelLocal(node: NoteNode): string | null {
  switch (node.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return node.text || null;
    case "list":
    case "checklist":
      return node.items[0]?.text || null;
    case "code":
      return node.code.split("\n")[0] || null;
    case "image":
      return node.alt || "[imagem]";
    default:
      return null;
  }
}

export function useInlineBookmark(opts: {
  text: string;
  setText: (s: string) => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  excludeNoteId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [triggerStart, setTriggerStart] = useState(-1);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    Promise.all([notebookService.list(), noteService.listAll()]).then(
      ([nbs, ns]) => {
        setNotebooks(nbs);
        setNotes(ns);
      }
    );
  }, []);

  const filteredNotes = opts.excludeNoteId
    ? notes.filter((n) => n.id !== opts.excludeNoteId)
    : notes;

  const results = useMemo<PickerResult[]>(() => {
    const q = query.toLowerCase().trim();
    const out: PickerResult[] = [];

    for (const nb of notebooks) {
      if (q && !nb.name.toLowerCase().includes(q)) continue;
      const Icon = getIconComponent(nb.iconName) ?? BookOpen;
      out.push({
        id: `nb-${nb.id}`,
        label: nb.name,
        meta: "Caderno",
        icon: <Icon className="size-3.5" />,
        ref: { kind: "notebook", notebookId: nb.id },
      });
      if (out.length >= 10) break;
    }

    for (const note of filteredNotes) {
      if (out.length >= 10) break;
      const text = note.title || "Sem título";
      if (q && !text.toLowerCase().includes(q)) continue;
      const nb = notebooks.find((x) => x.id === note.notebookId);
      out.push({
        id: `note-${note.id}`,
        label: text,
        meta: nb ? `Nota em ${nb.name}` : "Nota",
        icon: <FileText className="size-3.5" />,
        ref: { kind: "note", notebookId: note.notebookId, noteId: note.id },
      });
    }

    for (const note of filteredNotes) {
      if (out.length >= 10) break;
      for (const n of note.nodes ?? []) {
        if (out.length >= 10) break;
        const label = nodeLabelLocal(n);
        if (!label) continue;
        if (
          q &&
          !label.toLowerCase().includes(q) &&
          !(note.title || "").toLowerCase().includes(q)
        )
          continue;
        const nb = notebooks.find((x) => x.id === note.notebookId);
        out.push({
          id: `node-${n.id}`,
          label,
          meta: `Bloco em ${note.title || "Sem título"}${nb ? ` · ${nb.name}` : ""}`,
          icon: <Hash className="size-3.5" />,
          ref: {
            kind: "node",
            notebookId: note.notebookId,
            noteId: note.id,
            nodeId: n.id,
          },
        });
      }
    }

    return out;
  }, [notebooks, filteredNotes, query]);

  function pickResult(r: PickerResult) {
    const linkMd = buildLink(r.label, r.ref);
    const before = opts.text.slice(0, triggerStart);
    const after = opts.text.slice(triggerStart + 2 + query.length);
    const newText = before + linkMd + after;
    opts.setText(newText);
    setOpen(false);

    requestAnimationFrame(() => {
      const el = opts.inputRef.current;
      if (el) {
        const cursor = before.length + linkMd.length;
        el.focus();
        el.setSelectionRange(cursor, cursor);
      }
    });
  }

  function handleChange(text: string, cursor: number) {
    opts.setText(text);
    const trigger = detectTrigger(text, cursor);
    if (trigger) {
      setOpen(true);
      setTriggerStart(trigger.start);
      setQuery(trigger.query);
      setHighlight(0);
    } else {
      setOpen(false);
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ): boolean {
    if (!open) return false;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return true;
    }

    if (results.length === 0) return false;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pickResult(results[highlight]);
      return true;
    }
    return false;
  }

  return {
    open,
    query,
    results,
    highlight,
    handleChange,
    handleKeyDown,
    pickResult,
  };
}

export function InlineBookmarkPopover({
  open,
  results,
  highlight,
  onPick,
}: {
  open: boolean;
  results: PickerResult[];
  highlight: number;
  onPick: (r: PickerResult) => void;
}) {
  if (!open || results.length === 0) return null;

  return (
    <div className="bg-surface absolute left-0 top-full z-30 mt-1 max-h-64 w-full max-w-md overflow-y-auto rounded-md border shadow-md">
      <ul role="listbox" className="p-1">
        {results.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              role="option"
              aria-selected={i === highlight}
              // mouseDown evita que o blur do input feche o popover antes do click
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(r);
              }}
              className={cn(
                "flex w-full items-start gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors",
                i === highlight ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              <div className="text-muted-foreground mt-0.5">{r.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{r.label}</p>
                <p className="text-muted-foreground truncate text-[10px]">
                  {r.meta}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
