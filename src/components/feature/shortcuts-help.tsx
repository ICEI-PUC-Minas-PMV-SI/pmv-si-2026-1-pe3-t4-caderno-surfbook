"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";

/**
 * Modal de ajuda com atalhos de teclado. Aberto via `?` (Shift+/) globalmente
 * ou pelo Cmd+K → "Ver atalhos". Resolve o problema de descoberta de atalhos
 * no eixo-1: o usuário não tinha onde consultar e tendia a usar só o mouse.
 *
 * Estrutura: grupos por contexto, com kbd visual ao lado da descrição.
 */

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: Shortcut[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "Globais",
    items: [
      { keys: ["Ctrl", "K"], description: "Abrir busca / paleta de comandos" },
      { keys: ["?"], description: "Abrir esta ajuda" },
    ],
  },
  {
    title: "Editor de nota",
    items: [
      { keys: ["Ctrl", "S"], description: "Salvar agora (auto-save em 2s)" },
      { keys: ["Enter"], description: "Novo bloco abaixo (parágrafo) ou item (lista)" },
      { keys: ["Backspace"], description: "Em bloco vazio, remove e foca o anterior" },
      { keys: ["/"], description: "Em parágrafo vazio, abre menu de tipos de bloco" },
      { keys: ["[", "["], description: "Abre picker de referência (caderno/nota/bloco)" },
    ],
  },
  {
    title: "Listas e checklists",
    items: [
      { keys: ["Tab"], description: "Indenta item (cria sub-item)" },
      { keys: ["Shift", "Tab"], description: "Desfaz indentação" },
      { keys: ["Enter"], description: "Cria novo item da lista" },
    ],
  },
  {
    title: "Texto inline",
    items: [
      { keys: ["**texto**"], description: "Negrito" },
      { keys: ["*texto*"], description: "Itálico" },
      { keys: ["__texto__"], description: "Sublinhado" },
      { keys: ["~~texto~~"], description: "Tachado" },
      { keys: ["`texto`"], description: "Código inline" },
      { keys: ["[label](url)"], description: "Link (use surfbook:// pra link interno)" },
    ],
  },
];

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atalhos do teclado</DialogTitle>
          <DialogDescription>
            Os atalhos universais do SurfBook. Pressione{" "}
            <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
              ?
            </kbd>{" "}
            a qualquer momento pra abrir esta ajuda.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="text-foreground mb-2 text-sm font-semibold">
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground flex-1">
                      {s.description}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[11px]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
