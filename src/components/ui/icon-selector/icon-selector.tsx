"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";
import * as React from "react";

import { ICON_CATALOG, getIconComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface IconSelectorProps {
  value?: string;
  onChange: (name: string | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
}

export function IconSelector({
  value,
  onChange,
  placeholder = "Sem ícone",
  className,
  id,
  ...rest
}: IconSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const Selected = getIconComponent(value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_CATALOG;
    return ICON_CATALOG.filter(
      (i) =>
        i.name.includes(q) ||
        i.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          {...rest}
          className={cn(
            "border-border bg-surface flex h-10 w-full items-center gap-2 rounded border px-3 text-sm",
            "hover:bg-muted transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
            className
          )}
        >
          {Selected ? (
            <>
              <Selected className="size-4 text-brand-700" aria-hidden />
              <span className="text-foreground font-mono text-xs">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="text-muted-foreground ml-auto size-4" aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "bg-surface z-50 w-72 rounded-md border p-3 shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ícone…"
            autoFocus
            className={cn(
              "border-border bg-surface text-foreground placeholder:text-muted-foreground",
              "mb-2 h-8 w-full rounded border px-2 text-sm",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            )}
            aria-label="Buscar ícone"
          />
          <div
            role="listbox"
            aria-label="Ícones disponíveis"
            className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto"
          >
            {filtered.map(({ name, component: Icon }) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={value === name}
                title={name}
                aria-label={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex size-9 items-center justify-center rounded transition-colors",
                  "hover:bg-muted",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                  value === name &&
                    "bg-brand-100 text-brand-700 ring-1 ring-brand-300"
                )}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-muted-foreground col-span-6 px-1 py-2 text-xs">
                Nenhum ícone encontrado.
              </p>
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs"
            >
              <X className="size-3" aria-hidden />
              Remover ícone
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
