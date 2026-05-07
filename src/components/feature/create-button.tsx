"use client";

import { BookOpen, FileText, ListTodo, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";

/**
 * Botão global "+ Novo" — peça-chave que ataca o problema de descoberta de
 * features (E1 do diagnóstico do eixo-1). Disponível em qualquer tela via
 * `Topbar`; não depende mais do contexto da página atual.
 *
 * **Princípios aplicados:**
 * - **G2 (Shneiderman 1 — consistência):** mesma posição em toda tela
 * - **G2 (Shneiderman 3 — atalhos):** itens com atalhos visíveis
 * - **G4 (comunicabilidade):** rótulos imperativos específicos por tipo
 * - **G2 (Shneiderman 5 — controle):** dropdown abre só sob demanda
 */
interface CreateItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  shortcut?: string;
  disabled?: boolean;
}

const DEFAULT_ITEMS: CreateItem[] = [
  {
    label: "Caderno",
    href: "/cadernos/novo",
    icon: BookOpen,
    shortcut: "C",
  },
  {
    label: "Nota",
    icon: FileText,
    shortcut: "N",
    disabled: true,
  },
  {
    label: "Tarefa",
    icon: ListTodo,
    shortcut: "T",
    disabled: true,
  },
];

interface CreateButtonProps {
  items?: CreateItem[];
  className?: string;
}

export function CreateButton({
  items = DEFAULT_ITEMS,
  className,
}: CreateButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className}>
          <Plus className="size-4" aria-hidden />
          Novo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item) => {
          const content = (
            <>
              <item.icon className="size-4" aria-hidden />
              {item.label}
              {item.shortcut && (
                <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
              )}
            </>
          );

          if (item.disabled) {
            return (
              <DropdownMenuItem
                key={item.label}
                disabled
                className="cursor-not-allowed"
              >
                {content}
              </DropdownMenuItem>
            );
          }

          if (item.href) {
            return (
              <DropdownMenuItem key={item.label} asChild>
                <Link href={item.href}>{content}</Link>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem key={item.label}>{content}</DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
