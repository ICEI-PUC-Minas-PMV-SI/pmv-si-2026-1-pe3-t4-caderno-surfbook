"use client";

import { Hash } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NoteNode } from "@/types/note-node";

/**
 * Outline da nota — lista os headings em ordem com indentação por nível.
 * Click rola até o bloco (usa o id `node-<id>` que o BlockWrapper já expõe).
 *
 * Útil em notas longas pra navegação rápida — pattern comum (Notion, GitBook,
 * Obsidian outline plugin).
 */

interface NoteOutlineProps {
  nodes: NoteNode[];
}

export function NoteOutline({ nodes }: NoteOutlineProps) {
  const headings = nodes
    .filter((n): n is Extract<NoteNode, { type: "heading" }> =>
      n.type === "heading" && !!n.text.trim()
    )
    .sort((a, b) => a.position - b.position);

  if (headings.length === 0) {
    return (
      <p className="text-muted-foreground text-xs italic">
        Sem títulos ainda. Adicione um <strong>#</strong> pra estruturar.
      </p>
    );
  }

  function scrollTo(id: string) {
    const el = document.getElementById(`node-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-2", "ring-brand-300");
      setTimeout(() => el.classList.remove("ring-2", "ring-brand-300"), 1000);
    }
  }

  return (
    <ul className="space-y-0.5">
      {headings.map((h) => (
        <li
          key={h.id}
          style={{ paddingLeft: `${(h.level - 1) * 0.75}rem` }}
        >
          <button
            type="button"
            onClick={() => scrollTo(h.id)}
            className={cn(
              "hover:text-foreground hover:bg-muted/50 flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left transition-colors",
              h.level === 1
                ? "text-foreground text-sm font-medium"
                : "text-muted-foreground text-xs"
            )}
            title={h.text}
          >
            <Hash
              className="size-2.5 shrink-0 opacity-60"
              aria-hidden
            />
            <span className="truncate">{h.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
