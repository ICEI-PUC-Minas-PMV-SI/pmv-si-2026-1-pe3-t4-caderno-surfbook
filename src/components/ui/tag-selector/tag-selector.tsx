"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge/badge";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/tag";

const TAG_COLORS = [
  "#0dcaf0",
  "#fd7e14",
  "#198754",
  "#6f42c1",
  "#dc3545",
  "#ffc107",
  "#0d6efd",
  "#6c757d",
  "#d63384",
  "#20c997",
];

/** Cor aleatória da paleta — usada apenas quando uma tag é criada do zero. */
export function randomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

/**
 * Cor determinística por nome — preservada como utilidade e fallback,
 * mas a criação de tag nova agora usa `randomTagColor()`.
 */
export function colorForTagName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % TAG_COLORS.length;
  }
  return TAG_COLORS[hash];
}

export type { Tag } from "@/types/tag";

interface TagSelectorProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  /** Pool de tags existentes do usuário (de outros cadernos/notas). */
  suggestions?: Tag[];
  placeholder?: string;
  className?: string;
  id?: string;
}

export function TagSelector({
  value,
  onChange,
  suggestions = [],
  placeholder = "Digite e pressione Enter…",
  className,
  id,
}: TagSelectorProps) {
  const [input, setInput] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const valueNames = React.useMemo(
    () => new Set(value.map((t) => t.name.toLowerCase())),
    [value]
  );

  const filteredSuggestions = React.useMemo(() => {
    const q = input.trim().toLowerCase();
    return suggestions
      .filter((s) => !valueNames.has(s.name.toLowerCase()))
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestions, valueNames, input]);

  const exactMatchExists = React.useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return true;
    return suggestions.some((s) => s.name.toLowerCase() === q);
  }, [suggestions, input]);

  const showDropdown =
    focused &&
    (filteredSuggestions.length > 0 ||
      (input.trim().length > 0 && !exactMatchExists && !valueNames.has(input.trim().toLowerCase())));

  function addTag(rawName: string) {
    const name = rawName.trim();
    if (!name) return;
    if (valueNames.has(name.toLowerCase())) {
      setInput("");
      return;
    }

    // Reaproveita tag existente se o nome bate em alguma suggestion
    const existing = suggestions.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      onChange([...value, existing]);
    } else {
      onChange([
        ...value,
        {
          id: crypto.randomUUID(),
          name,
          color: randomTagColor(),
        },
      ]);
    }
    setInput("");
    setHighlight(0);
  }

  function pickSuggestion(tag: Tag) {
    if (valueNames.has(tag.name.toLowerCase())) return;
    onChange([...value, tag]);
    setInput("");
    setHighlight(0);
    inputRef.current?.focus();
  }

  function removeTag(idToRemove: string) {
    onChange(value.filter((t) => t.id !== idToRemove));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setHighlight((h) => Math.min(h + 1, filteredSuggestions.length - 1));
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setHighlight((h) => Math.max(h - 1, 0));
      }
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (showDropdown && filteredSuggestions[highlight]) {
        pickSuggestion(filteredSuggestions[highlight]);
      } else {
        addTag(input);
      }
      return;
    }
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value[value.length - 1].id);
      return;
    }
    if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "border-border bg-surface flex min-h-10 flex-wrap items-center gap-1.5 rounded border p-1.5",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500 focus-within:border-brand-500"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag.id} color={tag.color} className="gap-1 pr-1">
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag.id);
              }}
              aria-label={`Remover tag ${tag.name}`}
              className="hover:bg-white/25 rounded-sm transition-colors"
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 150);
            if (input.trim()) addTag(input);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className="text-foreground placeholder:text-muted-foreground min-w-[8ch] flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>

      {showDropdown && (
        <div
          className="bg-surface absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-md"
          role="listbox"
        >
          {filteredSuggestions.map((tag, i) => (
            <button
              key={tag.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                pickSuggestion(tag);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                i === highlight && "bg-muted"
              )}
            >
              <Badge color={tag.color}>{tag.name}</Badge>
            </button>
          ))}
          {input.trim() &&
            !exactMatchExists &&
            !valueNames.has(input.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(input);
                }}
                className={cn(
                  "text-muted-foreground hover:bg-muted flex w-full items-center gap-2 border-t px-3 py-1.5 text-left text-sm",
                  filteredSuggestions.length === 0 && "border-t-0"
                )}
              >
                Criar tag &ldquo;<span className="text-foreground">{input.trim()}</span>&rdquo;
              </button>
            )}
        </div>
      )}
    </div>
  );
}
