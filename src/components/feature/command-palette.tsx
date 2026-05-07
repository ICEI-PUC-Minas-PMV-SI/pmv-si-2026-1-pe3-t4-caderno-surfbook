"use client";

import {
  BookOpen,
  FileText,
  GraduationCap,
  Home,
  Keyboard,
  Plus,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command/command";
import { useToast } from "@/components/ui/toast/toast";
import { getIconComponent } from "@/lib/icons";
import { noteService, type Note } from "@/services/note-service";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenHelp?: () => void;
}

/**
 * Paleta de comandos global (Cmd/Ctrl+K). Resolve o problema de descoberta
 * de features em dois eixos:
 *
 * - **Atalho universal (G2 Shneiderman 3):** usuários frequentes acessam
 *   tudo sem mouse — buscar caderno, criar nota, navegar.
 * - **Busca cross-entidade:** filtra cadernos, notas e ações no mesmo
 *   campo. Reduz a "carga cognitiva" de saber em qual menu cada coisa está
 *   (G2 Shneiderman 8).
 */
export function CommandPalette({
  open,
  onOpenChange,
  onOpenHelp,
}: CommandPaletteProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([notebookService.list(), noteService.listAll()]).then(
      ([nbs, ns]) => {
        setNotebooks(nbs);
        setNotes(ns);
      }
    );
  }, [open]);

  function go(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  async function openTutorial() {
    const tutorial = notebooks.find((n) => n.system);
    if (!tutorial) {
      toast({
        title: "Tutorial não encontrado",
        description: "Recarregue a página pra recriá-lo.",
        variant: "danger",
      });
      onOpenChange(false);
      return;
    }
    if (tutorial.hidden) {
      try {
        await notebookService.update(tutorial.id, { hidden: false });
      } catch {
        // segue mesmo se falhar
      }
    }
    go(`/cadernos/${tutorial.id}/notas`);
  }

  const tutorialNotebook = notebooks.find((n) => n.system);

  // Mapa de notebookId → name pra mostrar contexto da nota
  const notebookById = new Map(notebooks.map((n) => [n.id, n]));

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      label="Buscar e navegar"
    >
      <CommandInput placeholder="Buscar cadernos, notas ou criar algo…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>

        <CommandGroup heading="Ações">
          <CommandItem
            value="criar caderno novo"
            onSelect={() => go("/cadernos/novo")}
          >
            <Plus className="size-4" aria-hidden />
            Criar caderno
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          {tutorialNotebook && (
            <CommandItem
              value="abrir tutorial comece por aqui ajuda"
              onSelect={openTutorial}
            >
              <GraduationCap className="size-4" aria-hidden />
              {tutorialNotebook.hidden
                ? "Restaurar tutorial"
                : "Abrir tutorial"}
            </CommandItem>
          )}
          {onOpenHelp && (
            <CommandItem
              value="atalhos teclado ajuda shortcuts help"
              onSelect={() => {
                onOpenChange(false);
                onOpenHelp();
              }}
            >
              <Keyboard className="size-4" aria-hidden />
              Ver atalhos do teclado
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegação">
          <CommandItem value="início home" onSelect={() => go("/")}>
            <Home className="size-4" aria-hidden />
            Início
          </CommandItem>
          <CommandItem
            value="cadernos lista"
            onSelect={() => go("/cadernos")}
          >
            <BookOpen className="size-4" aria-hidden />
            Cadernos
          </CommandItem>
          <CommandItem
            value="notas todas globais"
            onSelect={() => go("/notas")}
          >
            <FileText className="size-4" aria-hidden />
            Todas as notas
          </CommandItem>
          <CommandItem
            value="configuracoes"
            disabled
            onSelect={() => undefined}
          >
            <Settings className="size-4" aria-hidden />
            Configurações
            <span className="text-muted-foreground ml-auto text-[10px] italic">
              em breve
            </span>
          </CommandItem>
        </CommandGroup>

        {notebooks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Cadernos">
              {notebooks.slice(0, 10).map((nb) => {
                const Icon = getIconComponent(nb.iconName) ?? BookOpen;
                return (
                  <CommandItem
                    key={nb.id}
                    value={`${nb.name} ${nb.tags.map((t) => t.name).join(" ")}`}
                    onSelect={() => go(`/cadernos/${nb.id}/notas`)}
                  >
                    <Icon className="size-4" aria-hidden />
                    {nb.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {notes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Notas">
              {notes.slice(0, 15).map((n) => {
                const nb = notebookById.get(n.notebookId);
                return (
                  <CommandItem
                    key={n.id}
                    value={`${n.title} ${nb?.name ?? ""} ${n.tags.map((t) => t.name).join(" ")}`}
                    onSelect={() =>
                      go(`/cadernos/${n.notebookId}/notas/${n.id}`)
                    }
                  >
                    <FileText className="size-4" aria-hidden />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">
                        {n.title || "Sem título"}
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
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
