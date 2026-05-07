"use client";

import {
  BookOpen,
  Code as CodeIcon,
  FileText,
  GripVertical,
  Hash,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Link2,
  List as ListIcon,
  ListChecks,
  ListOrdered,
  Minus,
  MoreVertical,
  Plus,
  Quote as QuoteIcon,
  Text,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  InlineBookmarkPopover,
  useInlineBookmark,
} from "@/components/feature/inline-bookmark-trigger";
import { NoteNodeRenderer } from "@/components/feature/note-node-renderer";
import { parseInline } from "@/lib/inline-markdown";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command/command";
import { Button } from "@/components/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import { getIconComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { noteService, type Note } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";
import type {
  BookmarkNode,
  BookmarkRef,
  ChecklistNode,
  CodeNode,
  HeadingNode,
  ImageNode,
  ListNode,
  NoteNode,
  ParagraphNode,
  QuoteNode,
} from "@/services/note-service";

interface NoteEditorProps {
  nodes: NoteNode[];
  onChange: (nodes: NoteNode[]) => void;
  /** Id da nota atual — usado pra evitar bookmark "para si mesmo" no picker. */
  currentNoteId?: string;
}

/**
 * Omit distributivo — preserva os campos específicos de cada tipo da union.
 */
type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;
type NodeTemplate = DistributiveOmit<NoteNode, "id" | "position">;

function reposition(nodes: NoteNode[]): NoteNode[] {
  return nodes.map((n, i) => ({ ...n, position: i }));
}

function getEnterTemplate(node: NoteNode): NodeTemplate | null {
  switch (node.type) {
    case "heading":
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "quote":
      return { type: "quote", text: "" };
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Transform helpers                                                          */
/* -------------------------------------------------------------------------- */

function extractText(node: NoteNode): string {
  switch (node.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return node.text;
    case "list":
      return node.items.map((i) => i.text).join("\n");
    case "checklist":
      return node.items.map((i) => i.text).join("\n");
    case "code":
      return node.code;
    case "image":
      return node.alt ?? "";
    case "divider":
      return "";
    case "bookmark":
      return "";
  }
}

/** Texto resumido pra exibir um node como referência (em previews de bookmark). */
function nodeLabel(node: NoteNode): string | null {
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
    case "divider":
    case "bookmark":
      return null;
  }
}

function transformNode(oldNode: NoteNode, target: NodeTemplate): NoteNode {
  const id = oldNode.id;
  const position = oldNode.position;
  const text = extractText(oldNode);

  switch (target.type) {
    case "heading":
      return { id, position, type: "heading", level: target.level, text };
    case "paragraph":
      return { id, position, type: "paragraph", text };
    case "quote":
      return { id, position, type: "quote", text };
    case "list": {
      const lines = text ? text.split("\n").filter(Boolean) : [];
      return {
        id,
        position,
        type: "list",
        ordered: target.ordered,
        items: lines.length
          ? lines.map((t) => ({ text: t.trim(), indent: 0 }))
          : [{ text: "", indent: 0 }],
      };
    }
    case "checklist": {
      const lines = text ? text.split("\n").filter(Boolean) : [];
      return {
        id,
        position,
        type: "checklist",
        ordered: target.ordered,
        items: lines.length
          ? lines.map((t) => ({ checked: false, text: t.trim(), indent: 0 }))
          : [{ checked: false, text: "", indent: 0 }],
      };
    }
    case "code":
      return { id, position, type: "code", code: text };
    case "image":
      return { id, position, type: "image", url: "" };
    case "divider":
      return { id, position, type: "divider" };
    case "bookmark":
      return { id, position, type: "bookmark", ref: null };
  }
}

/* -------------------------------------------------------------------------- */
/* NoteEditor                                                                 */
/* -------------------------------------------------------------------------- */

export function NoteEditor({
  nodes,
  onChange,
  currentNoteId,
}: NoteEditorProps) {
  const sorted = [...nodes].sort((a, b) => a.position - b.position);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  function updateNode(id: string, next: NoteNode) {
    onChange(nodes.map((n) => (n.id === id ? next : n)));
  }

  function transformExistingNode(id: string, template: NodeTemplate) {
    const existing = nodes.find((n) => n.id === id);
    if (!existing) return;
    const transformed = transformNode(existing, template);
    onChange(nodes.map((n) => (n.id === id ? transformed : n)));
    setPendingFocusId(id);
  }

  function removeNode(id: string, focusPrev = false) {
    const sorted = [...nodes].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((n) => n.id === id);
    const prevId = idx > 0 ? sorted[idx - 1].id : null;
    onChange(reposition(nodes.filter((n) => n.id !== id)));
    if (focusPrev && prevId) setPendingFocusId(prevId);
  }

  function insertAfter(afterId: string | null, template: NodeTemplate) {
    const list = [...nodes].sort((a, b) => a.position - b.position);
    const at =
      afterId !== null
        ? list.findIndex((n) => n.id === afterId) + 1
        : list.length;
    const newId = crypto.randomUUID();
    const node = {
      ...template,
      id: newId,
      position: at,
    } as NoteNode;
    list.splice(at, 0, node);
    onChange(reposition(list));
    setPendingFocusId(newId);
  }

  function moveNode(fromId: string, toId: string, after: boolean) {
    if (fromId === toId) return;
    const list = [...nodes].sort((a, b) => a.position - b.position);
    const fromIdx = list.findIndex((n) => n.id === fromId);
    if (fromIdx === -1) return;
    const [moved] = list.splice(fromIdx, 1);
    const toIdx = list.findIndex((n) => n.id === toId);
    if (toIdx === -1) return;
    const insertAt = after ? toIdx + 1 : toIdx;
    list.splice(insertAt, 0, moved);
    onChange(reposition(list));
  }

  function clearPendingFocus(id: string) {
    setPendingFocusId((current) => (current === id ? null : current));
  }

  return (
    <div className="space-y-1">
      {sorted.map((node) => (
        <BlockWrapper
          key={node.id}
          node={node}
          shouldAutoFocus={node.id === pendingFocusId}
          onFocused={() => clearPendingFocus(node.id)}
          onUpdate={(next) => updateNode(node.id, next)}
          onTransform={(template) => transformExistingNode(node.id, template)}
          onRemove={() => removeNode(node.id)}
          onMergeWithPrevious={() => removeNode(node.id, true)}
          onAddAfter={(template) => insertAfter(node.id, template)}
          onMove={(fromId, after) => moveNode(fromId, node.id, after)}
          currentNoteId={currentNoteId}
        />
      ))}
      <div className="pt-3">
        <AddBlockMenu
          onAdd={(template) => insertAfter(null, template)}
          primary
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Block wrapper                                                              */
/* -------------------------------------------------------------------------- */

interface BlockWrapperProps {
  node: NoteNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: NoteNode) => void;
  onTransform: (template: NodeTemplate) => void;
  onRemove: () => void;
  onMergeWithPrevious: () => void;
  onAddAfter: (template: NodeTemplate) => void;
  onMove: (fromId: string, after: boolean) => void;
  currentNoteId?: string;
}

function BlockWrapper({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
  onTransform,
  onRemove,
  onMergeWithPrevious,
  onAddAfter,
  onMove,
  currentNoteId,
}: BlockWrapperProps) {
  const enterTemplate = getEnterTemplate(node);
  const handleEnterAfter = enterTemplate
    ? () => onAddAfter(enterTemplate)
    : undefined;

  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState<"top" | "bottom" | null>(null);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
    setDragging(true);
  }

  function handleDragEnd() {
    setDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("text/plain")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOver(e.clientY < midY ? "top" : "bottom");
  }

  function handleDragLeave(e: React.DragEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setDragOver(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const fromId = e.dataTransfer.getData("text/plain");
    const after = dragOver === "bottom";
    setDragOver(null);
    if (fromId) onMove(fromId, after);
  }

  return (
    <div
      id={`node-${node.id}`}
      className={cn(
        "group relative rounded py-1 transition-colors hover:bg-muted/30",
        dragging && "opacity-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver === "top" && (
        <div className="bg-brand-500 pointer-events-none absolute inset-x-0 -top-0.5 z-10 h-0.5 rounded-full" />
      )}
      {dragOver === "bottom" && (
        <div className="bg-brand-500 pointer-events-none absolute inset-x-0 -bottom-0.5 z-10 h-0.5 rounded-full" />
      )}

      <div
        className={cn(
          "absolute right-full top-1.5 flex items-center gap-0.5 pr-2 opacity-0 transition-opacity",
          "group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      >
        <DragHandle onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        <BlockTypeMenu
          node={node}
          onTransform={onTransform}
          onUpdate={onUpdate}
        />
        <AddBlockMenu onAdd={onAddAfter} compact />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Opções do bloco"
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 items-center justify-center rounded transition-colors"
            >
              <MoreVertical className="size-4" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2 className="size-4" aria-hidden />
              Excluir bloco
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <BlockContent
        node={node}
        shouldAutoFocus={shouldAutoFocus}
        onFocused={onFocused}
        onUpdate={onUpdate}
        onTransform={onTransform}
        onEnterAfter={handleEnterAfter}
        onMergeWithPrevious={onMergeWithPrevious}
        currentNoteId={currentNoteId}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drag handle                                                                */
/* -------------------------------------------------------------------------- */

function DragHandle({
  onDragStart,
  onDragEnd,
}: {
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label="Arraste para reordenar"
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 cursor-grab items-center justify-center rounded transition-colors active:cursor-grabbing"
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Block type menu (transform)                                                */
/* -------------------------------------------------------------------------- */

function BlockTypeMenu({
  node,
  onTransform,
  onUpdate,
}: {
  node: NoteNode;
  onTransform: (template: NodeTemplate) => void;
  onUpdate: (next: NoteNode) => void;
}) {
  const triggerLabel = (() => {
    if (node.type === "heading") {
      return <span className="font-mono text-[11px] font-semibold">H{node.level}</span>;
    }
    const meta = NON_HEADING_LABEL[node.type];
    if (meta.icon) {
      return <meta.icon className="size-3.5" aria-hidden />;
    }
    return <span className="font-mono text-[11px] font-semibold">{meta.label}</span>;
  })();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Tipo do bloco: ${typeLabelFor(node)}. Clique para transformar.`}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 items-center justify-center rounded transition-colors"
        >
          {triggerLabel}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Transformar em</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ADD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isCurrent = isSameType(node, opt.template);
          return (
            <DropdownMenuItem
              key={opt.label}
              disabled={isCurrent}
              onSelect={() => {
                if (
                  node.type === "heading" &&
                  opt.template.type === "heading" &&
                  opt.template.level !== node.level
                ) {
                  // só muda nível, preserva texto
                  onUpdate({ ...node, level: opt.template.level });
                  return;
                }
                if (!isCurrent) onTransform(opt.template);
              }}
            >
              <Icon className="size-4" aria-hidden />
              {opt.label}
              {isCurrent && (
                <span className="text-muted-foreground ml-auto text-[10px]">atual</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NON_HEADING_LABEL: Record<
  Exclude<NoteNode["type"], "heading">,
  {
    label?: string;
    icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }
> = {
  paragraph: { label: "P" },
  list: { icon: ListIcon },
  checklist: { icon: ListChecks },
  quote: { icon: QuoteIcon },
  code: { icon: CodeIcon },
  image: { icon: ImageIcon },
  divider: { icon: Minus },
  bookmark: { icon: Link2 },
};

function typeLabelFor(node: NoteNode): string {
  if (node.type === "heading") return `Título H${node.level}`;
  const map: Record<Exclude<NoteNode["type"], "heading">, string> = {
    paragraph: "Parágrafo",
    list: "Lista",
    checklist: "Lista de tarefas",
    quote: "Citação",
    code: "Código",
    image: "Imagem",
    divider: "Divisor",
    bookmark: "Link interno",
  };
  return map[node.type];
}

function isSameType(node: NoteNode, template: NodeTemplate): boolean {
  if (node.type !== template.type) return false;
  if (node.type === "heading" && template.type === "heading") {
    return node.level === template.level;
  }
  if (node.type === "list" && template.type === "list") {
    return node.ordered === template.ordered;
  }
  if (node.type === "checklist" && template.type === "checklist") {
    return node.ordered === template.ordered;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/* Block content dispatcher                                                   */
/* -------------------------------------------------------------------------- */

interface BlockContentProps {
  node: NoteNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: NoteNode) => void;
  onTransform: (template: NodeTemplate) => void;
  onEnterAfter?: () => void;
  onMergeWithPrevious: () => void;
  currentNoteId?: string;
}

function BlockContent({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
  onTransform,
  onEnterAfter,
  onMergeWithPrevious,
  currentNoteId,
}: BlockContentProps) {
  switch (node.type) {
    case "heading":
      return (
        <HeadingBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
          onEnterAfter={onEnterAfter}
          onMergeWithPrevious={onMergeWithPrevious}
          currentNoteId={currentNoteId}
        />
      );
    case "paragraph":
      return (
        <ParagraphBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
          onTransform={onTransform}
          onEnterAfter={onEnterAfter}
          onMergeWithPrevious={onMergeWithPrevious}
          currentNoteId={currentNoteId}
        />
      );
    case "quote":
      return (
        <QuoteBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
          onEnterAfter={onEnterAfter}
          onMergeWithPrevious={onMergeWithPrevious}
          currentNoteId={currentNoteId}
        />
      );
    case "list":
      return (
        <ListBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
        />
      );
    case "checklist":
      return (
        <ChecklistBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
        />
      );
    case "code":
      return (
        <CodeBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
        />
      );
    case "image":
      return (
        <ImageBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
        />
      );
    case "divider":
      return <hr className="border-border my-2" />;
    case "bookmark":
      return (
        <BookmarkBlock
          node={node}
          shouldAutoFocus={shouldAutoFocus}
          onFocused={onFocused}
          onUpdate={onUpdate}
          currentNoteId={currentNoteId}
        />
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}

function useAutoFocus<T extends HTMLElement>(
  shouldFocus: boolean,
  onFocused: () => void
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
      onFocused();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFocus]);
  return ref;
}

/* -------------------------------------------------------------------------- */
/* Heading                                                                    */
/* -------------------------------------------------------------------------- */

const HEADING_SIZES: Record<1 | 2 | 3, string> = {
  1: "text-3xl",
  2: "text-2xl",
  3: "text-xl",
};

function HeadingBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
  onEnterAfter,
  onMergeWithPrevious,
  currentNoteId,
}: {
  node: HeadingNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: HeadingNode) => void;
  onEnterAfter?: () => void;
  onMergeWithPrevious: () => void;
  currentNoteId?: string;
}) {
  const ref = useAutoFocus<HTMLInputElement>(shouldAutoFocus, onFocused);
  const [editing, setEditing] = useState(shouldAutoFocus || !node.text);
  useEffect(() => {
    if (shouldAutoFocus) setEditing(true);
  }, [shouldAutoFocus]);
  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const inline = useInlineBookmark({
    text: node.text,
    setText: (text) => onUpdate({ ...node, text }),
    inputRef: ref,
    excludeNoteId: currentNoteId,
  });

  if (!editing) {
    return (
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) return;
          setEditing(true);
        }}
        className="hover:bg-muted/20 -mx-1 cursor-text rounded px-1 transition-colors"
      >
        {node.text ? (
          <NoteNodeRenderer node={node} />
        ) : (
          <span
            className={cn(
              "font-display text-muted-foreground/40 font-semibold tracking-tight",
              HEADING_SIZES[node.level]
            )}
          >
            Título…
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        value={node.text}
        onChange={(e) =>
          inline.handleChange(e.target.value, e.target.selectionStart ?? 0)
        }
        onBlur={() => {
          if (inline.open) return;
          if (node.text) setEditing(false);
        }}
        onKeyDown={(e) => {
          if (inline.handleKeyDown(e)) return;
          if (e.key === "Enter") {
            e.preventDefault();
            onEnterAfter?.();
            return;
          }
          if (
            e.key === "Backspace" &&
            node.text === "" &&
            e.currentTarget.selectionStart === 0
          ) {
            e.preventDefault();
            onMergeWithPrevious();
          }
        }}
        placeholder="Título…"
        className={cn(
          "font-display placeholder:text-muted-foreground/40 w-full bg-transparent font-semibold tracking-tight outline-none",
          HEADING_SIZES[node.level]
        )}
        aria-label={`Título nível ${node.level}`}
      />
      <InlineBookmarkPopover
        open={inline.open}
        results={inline.results}
        highlight={inline.highlight}
        onPick={inline.pickResult}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Paragraph (com slash command)                                              */
/* -------------------------------------------------------------------------- */

function ParagraphBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
  onTransform,
  onEnterAfter,
  onMergeWithPrevious,
  currentNoteId,
}: {
  node: ParagraphNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: ParagraphNode) => void;
  onTransform: (template: NodeTemplate) => void;
  onEnterAfter?: () => void;
  onMergeWithPrevious: () => void;
  currentNoteId?: string;
}) {
  const sizingRef = useAutoResize(node.text);
  const focusRef = useAutoFocus<HTMLTextAreaElement>(shouldAutoFocus, onFocused);
  const [slashOpen, setSlashOpen] = useState(false);
  const [editing, setEditing] = useState(shouldAutoFocus || !node.text);
  useEffect(() => {
    if (shouldAutoFocus) setEditing(true);
  }, [shouldAutoFocus]);
  useEffect(() => {
    if (editing && focusRef.current) focusRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function setRefs(el: HTMLTextAreaElement | null) {
    sizingRef.current = el;
    focusRef.current = el;
  }

  const inline = useInlineBookmark({
    text: node.text,
    setText: (text) => onUpdate({ ...node, text }),
    inputRef: focusRef,
    excludeNoteId: currentNoteId,
  });

  if (!editing) {
    return (
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) return;
          setEditing(true);
        }}
        className="hover:bg-muted/20 -mx-1 cursor-text rounded px-1 transition-colors"
      >
        {node.text ? (
          <NoteNodeRenderer node={node} />
        ) : (
          <p className="text-muted-foreground/40 text-base leading-relaxed">
            Escreva, &ldquo;/&rdquo; para tipos, &ldquo;[[&rdquo; para links…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <textarea
        ref={setRefs}
        rows={1}
        value={node.text}
        onChange={(e) =>
          inline.handleChange(e.target.value, e.target.selectionStart ?? 0)
        }
        onBlur={() => {
          if (inline.open || slashOpen) return;
          if (node.text) setEditing(false);
        }}
        onKeyDown={(e) => {
          if (inline.handleKeyDown(e)) return;
          if (
            e.key === "/" &&
            node.text === "" &&
            !slashOpen &&
            !e.shiftKey &&
            !e.metaKey &&
            !e.ctrlKey
          ) {
            e.preventDefault();
            setSlashOpen(true);
            return;
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnterAfter?.();
            return;
          }
          if (
            e.key === "Backspace" &&
            node.text === "" &&
            e.currentTarget.selectionStart === 0
          ) {
            e.preventDefault();
            onMergeWithPrevious();
          }
        }}
        placeholder='Escreva, Enter para novo parágrafo, "/" para tipos, "[[" para links…'
        className="placeholder:text-muted-foreground/40 w-full resize-none overflow-hidden bg-transparent text-base leading-relaxed outline-none"
        aria-label="Parágrafo"
      />
      <SlashCommandMenu
        open={slashOpen}
        onOpenChange={setSlashOpen}
        onSelect={(template) => {
          onTransform(template);
          setSlashOpen(false);
        }}
      />
      <InlineBookmarkPopover
        open={inline.open}
        results={inline.results}
        highlight={inline.highlight}
        onPick={inline.pickResult}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Slash command menu                                                         */
/* -------------------------------------------------------------------------- */

function SlashCommandMenu({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: NodeTemplate) => void;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 size-0"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-52">
        <DropdownMenuLabel>Inserir bloco</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ADD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.label}
              onSelect={() => onSelect(opt.template)}
            >
              <Icon className="size-4" aria-hidden />
              {opt.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/* Quote                                                                      */
/* -------------------------------------------------------------------------- */

function QuoteBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
  onEnterAfter,
  onMergeWithPrevious,
  currentNoteId,
}: {
  node: QuoteNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: QuoteNode) => void;
  onEnterAfter?: () => void;
  onMergeWithPrevious: () => void;
  currentNoteId?: string;
}) {
  const sizingRef = useAutoResize(node.text);
  const focusRef = useAutoFocus<HTMLTextAreaElement>(shouldAutoFocus, onFocused);
  const [editing, setEditing] = useState(shouldAutoFocus || !node.text);
  useEffect(() => {
    if (shouldAutoFocus) setEditing(true);
  }, [shouldAutoFocus]);
  useEffect(() => {
    if (editing && focusRef.current) focusRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function setRefs(el: HTMLTextAreaElement | null) {
    sizingRef.current = el;
    focusRef.current = el;
  }

  const inline = useInlineBookmark({
    text: node.text,
    setText: (text) => onUpdate({ ...node, text }),
    inputRef: focusRef,
    excludeNoteId: currentNoteId,
  });

  if (!editing) {
    return (
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) return;
          setEditing(true);
        }}
        className="hover:bg-muted/20 -mx-1 cursor-text rounded px-1 transition-colors"
      >
        {node.text ? (
          <NoteNodeRenderer node={node} />
        ) : (
          <div className="border-brand-300 border-l-4 pl-4">
            <p className="text-muted-foreground/40 italic">Citação…</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-brand-300 relative border-l-4 pl-4">
      <textarea
        ref={setRefs}
        rows={1}
        value={node.text}
        onChange={(e) =>
          inline.handleChange(e.target.value, e.target.selectionStart ?? 0)
        }
        onBlur={() => {
          if (inline.open) return;
          if (node.text) setEditing(false);
        }}
        onKeyDown={(e) => {
          if (inline.handleKeyDown(e)) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnterAfter?.();
            return;
          }
          if (
            e.key === "Backspace" &&
            node.text === "" &&
            e.currentTarget.selectionStart === 0
          ) {
            e.preventDefault();
            onMergeWithPrevious();
          }
        }}
        placeholder="Citação… (Shift+Enter para quebra de linha)"
        className="placeholder:text-muted-foreground/40 text-muted-foreground w-full resize-none overflow-hidden bg-transparent italic outline-none"
        aria-label="Citação"
      />
      <InlineBookmarkPopover
        open={inline.open}
        results={inline.results}
        highlight={inline.highlight}
        onPick={inline.pickResult}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

function ListBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
}: {
  node: ListNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: ListNode) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(
    shouldAutoFocus ? 0 : null
  );

  useEffect(() => {
    if (shouldAutoFocus) {
      setEditingIndex(0);
      onFocused();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoFocus]);

  useEffect(() => {
    if (editingIndex !== null) {
      const el = inputRefs.current[editingIndex];
      if (el) el.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex, node.items.length]);

  function setItemText(i: number, text: string) {
    const items = [...node.items];
    items[i] = { ...items[i], text };
    onUpdate({ ...node, items });
  }

  function addItem(at?: number) {
    const items = [...node.items];
    const newAt = at ?? items.length;
    const indent = newAt > 0 ? items[newAt - 1].indent : 0;
    items.splice(newAt, 0, { text: "", indent });
    onUpdate({ ...node, items });
    setEditingIndex(newAt);
  }

  function removeItem(i: number) {
    if (node.items.length === 1) return;
    onUpdate({ ...node, items: node.items.filter((_, idx) => idx !== i) });
    setEditingIndex(Math.max(0, i - 1));
  }

  function indentItem(i: number, delta: 1 | -1) {
    const items = [...node.items];
    const current = items[i].indent;
    if (delta === 1) {
      const maxIndent = i > 0 ? items[i - 1].indent + 1 : 0;
      items[i] = { ...items[i], indent: Math.min(current + 1, maxIndent) };
    } else {
      items[i] = { ...items[i], indent: Math.max(0, current - 1) };
    }
    onUpdate({ ...node, items });
  }

  function toggleOrdered() {
    onUpdate({ ...node, ordered: !node.ordered });
  }

  function onItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(i + 1);
    } else if (
      e.key === "Backspace" &&
      node.items[i].text === "" &&
      node.items.length > 1
    ) {
      e.preventDefault();
      removeItem(i);
    } else if (e.key === "Tab") {
      e.preventDefault();
      indentItem(i, e.shiftKey ? -1 : 1);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleOrdered}
        className="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-xs"
      >
        {node.ordered ? (
          <ListOrdered className="size-3" aria-hidden />
        ) : (
          <ListIcon className="size-3" aria-hidden />
        )}
        {node.ordered ? "Numerada" : "Bullets"}
      </button>
      <ul className="space-y-1">
        {node.items.map((item, i) => {
          const isEditing = editingIndex === i;
          return (
            <li
              key={i}
              className="flex items-start gap-2"
              style={{ paddingLeft: `${item.indent * 1.5}rem` }}
            >
              <span className="text-muted-foreground mt-1 w-5 shrink-0 text-sm">
                {node.ordered ? `${i + 1}.` : "•"}
              </span>
              {isEditing ? (
                <input
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  value={item.text}
                  onChange={(e) => setItemText(i, e.target.value)}
                  onKeyDown={(e) => onItemKeyDown(e, i)}
                  onBlur={() => setEditingIndex(null)}
                  placeholder="Item… (Tab indenta)"
                  className="placeholder:text-muted-foreground/40 flex-1 bg-transparent outline-none"
                  aria-label={`Item ${i + 1}`}
                />
              ) : (
                <span
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return;
                    setEditingIndex(i);
                  }}
                  className="hover:bg-muted/20 -mx-1 flex-1 cursor-text rounded px-1 transition-colors"
                >
                  {item.text ? (
                    parseInline(item.text)
                  ) : (
                    <span className="text-muted-foreground/40">Item vazio…</span>
                  )}
                </span>
              )}
              {node.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label="Remover item"
                  className="text-muted-foreground hover:text-danger opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => addItem()}
        className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 pl-7 text-xs"
      >
        <Plus className="size-3" aria-hidden />
        Adicionar item
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Checklist                                                                  */
/* -------------------------------------------------------------------------- */

function ChecklistBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
}: {
  node: ChecklistNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: ChecklistNode) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(
    shouldAutoFocus ? 0 : null
  );

  useEffect(() => {
    if (shouldAutoFocus) {
      setEditingIndex(0);
      onFocused();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoFocus]);

  useEffect(() => {
    if (editingIndex !== null) {
      const el = inputRefs.current[editingIndex];
      if (el) el.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex, node.items.length]);

  function setItem(i: number, patch: { checked?: boolean; text?: string }) {
    const items = [...node.items];
    items[i] = { ...items[i], ...patch };
    onUpdate({ ...node, items });
  }

  function addItem(at?: number) {
    const items = [...node.items];
    const newAt = at ?? items.length;
    const indent = newAt > 0 ? items[newAt - 1].indent : 0;
    items.splice(newAt, 0, { checked: false, text: "", indent });
    onUpdate({ ...node, items });
    setEditingIndex(newAt);
  }

  function removeItem(i: number) {
    if (node.items.length === 1) return;
    onUpdate({ ...node, items: node.items.filter((_, idx) => idx !== i) });
    setEditingIndex(Math.max(0, i - 1));
  }

  function indentItem(i: number, delta: 1 | -1) {
    const items = [...node.items];
    const current = items[i].indent;
    if (delta === 1) {
      const maxIndent = i > 0 ? items[i - 1].indent + 1 : 0;
      items[i] = { ...items[i], indent: Math.min(current + 1, maxIndent) };
    } else {
      items[i] = { ...items[i], indent: Math.max(0, current - 1) };
    }
    onUpdate({ ...node, items });
  }

  function onItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(i + 1);
    } else if (
      e.key === "Backspace" &&
      node.items[i].text === "" &&
      node.items.length > 1
    ) {
      e.preventDefault();
      removeItem(i);
    } else if (e.key === "Tab") {
      e.preventDefault();
      indentItem(i, e.shiftKey ? -1 : 1);
    }
  }

  return (
    <div>
      <ul className="space-y-1">
        {node.items.map((item, i) => {
          const isEditing = editingIndex === i;
          return (
            <li
              key={i}
              className="flex items-start gap-2"
              style={{ paddingLeft: `${item.indent * 1.5}rem` }}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => setItem(i, { checked: e.target.checked })}
                aria-label={item.text || `Item ${i + 1}`}
                className="border-border accent-brand-500 mt-1.5 size-3.5 shrink-0 rounded"
              />
              {isEditing ? (
                <input
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  value={item.text}
                  onChange={(e) => setItem(i, { text: e.target.value })}
                  onKeyDown={(e) => onItemKeyDown(e, i)}
                  onBlur={() => setEditingIndex(null)}
                  placeholder="Tarefa… (Tab indenta)"
                  className={cn(
                    "placeholder:text-muted-foreground/40 flex-1 bg-transparent outline-none",
                    item.checked && "text-muted-foreground line-through"
                  )}
                />
              ) : (
                <span
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return;
                    setEditingIndex(i);
                  }}
                  className={cn(
                    "hover:bg-muted/20 -mx-1 flex-1 cursor-text rounded px-1 transition-colors",
                    item.checked && "text-muted-foreground line-through"
                  )}
                >
                  {item.text ? (
                    parseInline(item.text)
                  ) : (
                    <span className="text-muted-foreground/40">Tarefa vazia…</span>
                  )}
                </span>
              )}
              {node.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label="Remover item"
                  className="text-muted-foreground hover:text-danger opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" aria-hidden />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => addItem()}
        className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 pl-6 text-xs"
      >
        <Plus className="size-3" aria-hidden />
        Adicionar tarefa
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Code                                                                       */
/* -------------------------------------------------------------------------- */

function CodeBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
}: {
  node: CodeNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: CodeNode) => void;
}) {
  const sizingRef = useAutoResize(node.code);
  const focusRef = useAutoFocus<HTMLTextAreaElement>(shouldAutoFocus, onFocused);

  function setRefs(el: HTMLTextAreaElement | null) {
    sizingRef.current = el;
    focusRef.current = el;
  }

  return (
    <div className="bg-muted/60 space-y-2 rounded p-3">
      <input
        type="text"
        value={node.language ?? ""}
        onChange={(e) =>
          onUpdate({ ...node, language: e.target.value || undefined })
        }
        placeholder="linguagem (opcional)"
        className="placeholder:text-muted-foreground/40 text-muted-foreground bg-transparent font-mono text-xs outline-none"
        aria-label="Linguagem do código"
      />
      <textarea
        ref={setRefs}
        rows={1}
        value={node.code}
        onChange={(e) => onUpdate({ ...node, code: e.target.value })}
        placeholder="// código…"
        className="placeholder:text-muted-foreground/40 w-full resize-none overflow-hidden bg-transparent font-mono text-sm leading-relaxed outline-none"
        aria-label="Código"
        spellCheck={false}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Image                                                                      */
/* -------------------------------------------------------------------------- */

function ImageBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
}: {
  node: ImageNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: ImageNode) => void;
}) {
  const ref = useAutoFocus<HTMLInputElement>(shouldAutoFocus, onFocused);
  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="url"
        value={node.url}
        onChange={(e) => onUpdate({ ...node, url: e.target.value })}
        placeholder="https://… (URL da imagem)"
        className="placeholder:text-muted-foreground/40 text-foreground border-border w-full rounded border bg-transparent px-3 py-2 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        aria-label="URL da imagem"
      />
      <input
        type="text"
        value={node.alt ?? ""}
        onChange={(e) =>
          onUpdate({ ...node, alt: e.target.value || undefined })
        }
        placeholder="Texto alternativo (acessibilidade)"
        className="placeholder:text-muted-foreground/40 text-muted-foreground w-full bg-transparent text-xs outline-none"
        aria-label="Texto alternativo da imagem"
      />
      {node.url && (
        <div className="bg-muted/40 overflow-hidden rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.url}
            alt={node.alt ?? ""}
            className="max-w-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookmark — referência interna a notebook/note/node                         */
/* -------------------------------------------------------------------------- */

function BookmarkBlock({
  node,
  shouldAutoFocus,
  onFocused,
  onUpdate,
  currentNoteId,
}: {
  node: BookmarkNode;
  shouldAutoFocus: boolean;
  onFocused: () => void;
  onUpdate: (next: BookmarkNode) => void;
  currentNoteId?: string;
}) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);

  useEffect(() => {
    Promise.all([notebookService.list(), noteService.listAll()]).then(
      ([nbs, ns]) => {
        setNotebooks(nbs);
        setAllNotes(ns);
      }
    );
  }, []);

  const notebookById = useMemo(
    () => new Map(notebooks.map((n) => [n.id, n])),
    [notebooks]
  );
  const noteById = useMemo(
    () => new Map(allNotes.map((n) => [n.id, n])),
    [allNotes]
  );

  function pick(ref: BookmarkRef) {
    onUpdate({ ...node, ref });
  }

  function clear() {
    onUpdate({ ...node, ref: null });
  }

  if (!node.ref) {
    return (
      <BookmarkPicker
        notebooks={notebooks}
        notes={allNotes.filter((n) => n.id !== currentNoteId)}
        notebookById={notebookById}
        onPick={pick}
        shouldAutoFocus={shouldAutoFocus}
        onFocused={onFocused}
      />
    );
  }

  return (
    <BookmarkPreview
      bref={node.ref}
      notebookById={notebookById}
      noteById={noteById}
      onClear={clear}
    />
  );
}

function BookmarkPicker({
  notebooks,
  notes,
  notebookById,
  onPick,
  shouldAutoFocus,
  onFocused,
}: {
  notebooks: Notebook[];
  notes: Note[];
  notebookById: Map<string, Notebook>;
  onPick: (ref: BookmarkRef) => void;
  shouldAutoFocus: boolean;
  onFocused: () => void;
}) {
  const inputRef = useAutoFocus<HTMLInputElement>(shouldAutoFocus, onFocused);

  // Coleta nós com texto pra serem alvos do bookmark "node"
  const allBlockRefs = useMemo(() => {
    const out: { note: Note; node: NoteNode; preview: string }[] = [];
    for (const note of notes) {
      for (const n of note.nodes ?? []) {
        const preview = nodeLabel(n);
        if (preview) out.push({ note, node: n, preview });
      }
    }
    return out.slice(0, 20);
  }, [notes]);

  return (
    <Command className="bg-surface rounded-md border">
      <CommandInput
        ref={inputRef}
        placeholder="Buscar caderno, nota ou bloco para referenciar…"
      />
      <CommandList className="max-h-72">
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        {notebooks.length > 0 && (
          <CommandGroup heading="Cadernos">
            {notebooks.slice(0, 6).map((nb) => {
              const Icon = getIconComponent(nb.iconName) ?? BookOpen;
              return (
                <CommandItem
                  key={`nb-${nb.id}`}
                  value={`caderno ${nb.name}`}
                  onSelect={() =>
                    onPick({ kind: "notebook", notebookId: nb.id })
                  }
                >
                  <Icon className="size-4" aria-hidden />
                  {nb.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {notes.length > 0 && (
          <CommandGroup heading="Notas">
            {notes.slice(0, 8).map((note) => {
              const nb = notebookById.get(note.notebookId);
              return (
                <CommandItem
                  key={`note-${note.id}`}
                  value={`nota ${note.title} ${nb?.name ?? ""}`}
                  onSelect={() =>
                    onPick({
                      kind: "note",
                      notebookId: note.notebookId,
                      noteId: note.id,
                    })
                  }
                >
                  <FileText className="size-4" aria-hidden />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {note.title || "Sem título"}
                    </span>
                    {nb && (
                      <span className="text-muted-foreground truncate text-[10px]">
                        {nb.name}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {allBlockRefs.length > 0 && (
          <CommandGroup heading="Blocos">
            {allBlockRefs.map(({ note, node, preview }) => {
              const nb = notebookById.get(note.notebookId);
              return (
                <CommandItem
                  key={`node-${node.id}`}
                  value={`bloco ${preview} ${note.title} ${nb?.name ?? ""}`}
                  onSelect={() =>
                    onPick({
                      kind: "node",
                      notebookId: note.notebookId,
                      noteId: note.id,
                      nodeId: node.id,
                    })
                  }
                >
                  <Hash className="size-4" aria-hidden />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{preview}</span>
                    <span className="text-muted-foreground truncate text-[10px]">
                      {note.title || "Sem título"} · {nb?.name ?? ""}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}

function BookmarkPreview({
  bref,
  notebookById,
  noteById,
  onClear,
}: {
  bref: BookmarkRef;
  notebookById: Map<string, Notebook>;
  noteById: Map<string, Note>;
  onClear: () => void;
}) {
  let href = "";
  let icon: React.ReactNode = null;
  let label = "";
  let meta = "";
  let invalid = false;

  if (bref.kind === "notebook") {
    const nb = notebookById.get(bref.notebookId);
    if (!nb) {
      invalid = true;
    } else {
      const Icon = getIconComponent(nb.iconName) ?? BookOpen;
      href = `/cadernos/${bref.notebookId}/notas`;
      icon = <Icon className="size-4" aria-hidden />;
      label = nb.name;
      meta = "Caderno";
    }
  } else if (bref.kind === "note") {
    const note = noteById.get(bref.noteId);
    if (!note) {
      invalid = true;
    } else {
      const nb = notebookById.get(bref.notebookId);
      href = `/cadernos/${bref.notebookId}/notas/${bref.noteId}`;
      icon = <FileText className="size-4" aria-hidden />;
      label = note.title || "Sem título";
      meta = `Nota em ${nb?.name ?? "?"}`;
    }
  } else {
    const note = noteById.get(bref.noteId);
    if (!note) {
      invalid = true;
    } else {
      const nb = notebookById.get(bref.notebookId);
      const target = note.nodes.find((n) => n.id === bref.nodeId);
      if (!target) {
        invalid = true;
      } else {
        href = `/cadernos/${bref.notebookId}/notas/${bref.noteId}#node-${bref.nodeId}`;
        icon = <Hash className="size-4" aria-hidden />;
        label = nodeLabel(target) || "(sem texto)";
        meta = `Bloco em ${note.title || "Sem título"} · ${nb?.name ?? "?"}`;
      }
    }
  }

  if (invalid) {
    return (
      <div className="bg-muted/40 text-muted-foreground flex items-center justify-between gap-2 rounded border border-dashed p-3 text-sm">
        <span>Link quebrado — alvo foi excluído.</span>
        <button
          type="button"
          onClick={onClear}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="group/bookmark relative">
      <Link
        href={href}
        className={cn(
          "bg-muted/30 hover:bg-muted/50 hover:border-brand-300 block rounded-md border p-3 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="bg-brand-100 text-brand-700 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{label}</p>
            <p className="text-muted-foreground truncate text-xs">{meta}</p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={onClear}
        aria-label="Remover link"
        className="bg-surface text-muted-foreground hover:text-danger absolute right-2 top-2 hidden size-6 items-center justify-center rounded border shadow-sm group-hover/bookmark:flex"
      >
        <X className="size-3" aria-hidden />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Add-block menu                                                             */
/* -------------------------------------------------------------------------- */

const ADD_OPTIONS: {
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  template: NodeTemplate;
}[] = [
  {
    label: "Título grande",
    icon: Heading1,
    template: { type: "heading", level: 1, text: "" },
  },
  {
    label: "Subtítulo",
    icon: Heading2,
    template: { type: "heading", level: 2, text: "" },
  },
  {
    label: "Texto",
    icon: Text,
    template: { type: "paragraph", text: "" },
  },
  {
    label: "Lista",
    icon: ListIcon,
    template: { type: "list", ordered: false, items: [{ text: "", indent: 0 }] },
  },
  {
    label: "Lista numerada",
    icon: ListOrdered,
    template: { type: "list", ordered: true, items: [{ text: "", indent: 0 }] },
  },
  {
    label: "Lista de tarefas",
    icon: ListChecks,
    template: {
      type: "checklist",
      ordered: false,
      items: [{ checked: false, text: "", indent: 0 }],
    },
  },
  {
    label: "Citação",
    icon: QuoteIcon,
    template: { type: "quote", text: "" },
  },
  {
    label: "Código",
    icon: CodeIcon,
    template: { type: "code", code: "" },
  },
  {
    label: "Imagem",
    icon: ImageIcon,
    template: { type: "image", url: "" },
  },
  {
    label: "Divisor",
    icon: Minus,
    template: { type: "divider" },
  },
  {
    label: "Link interno",
    icon: Link2,
    template: { type: "bookmark", ref: null },
  },
];

interface AddBlockMenuProps {
  onAdd: (template: NodeTemplate) => void;
  primary?: boolean;
  compact?: boolean;
}

function AddBlockMenu({ onAdd, primary, compact }: AddBlockMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label="Adicionar bloco abaixo"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 items-center justify-center rounded transition-colors"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        ) : (
          <Button variant={primary ? "secondary" : "ghost"} size="sm">
            <Plus className="size-4" aria-hidden />
            Adicionar bloco
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Tipos de bloco</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ADD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.label}
              onSelect={() => onAdd(opt.template)}
            >
              <Icon className="size-4" aria-hidden />
              {opt.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
