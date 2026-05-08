"use client";

import {
  BookOpen,
  CalendarClock,
  FileText,
  ListTodo,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CreateNoteDialog } from "@/components/feature/create-note-dialog";
import { usePeek } from "@/components/feature/peek-provider";
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
interface CreateButtonProps {
  className?: string;
}

export function CreateButton({ className }: CreateButtonProps) {
  const peek = usePeek();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className={className}>
            <Plus className="size-4" aria-hidden />
            Novo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href="/cadernos/novo">
              <BookOpen className="size-4" aria-hidden />
              Caderno
              <DropdownMenuShortcut>C</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setNoteDialogOpen(true)}>
            <FileText className="size-4" aria-hidden />
            Nota
            <DropdownMenuShortcut>N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => peek.openTaskNew()}>
            <ListTodo className="size-4" aria-hidden />
            Tarefa
            <DropdownMenuShortcut>T</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => peek.openEventNew()}>
            <CalendarClock className="size-4" aria-hidden />
            Evento
            <DropdownMenuShortcut>E</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
      />
    </>
  );
}
