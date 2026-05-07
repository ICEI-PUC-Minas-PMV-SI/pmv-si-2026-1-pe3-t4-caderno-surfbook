import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HelpCircle, Plus, Settings } from "lucide-react";

import { Button } from "../button/button";
import { Tooltip } from "./tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Design System/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Princípio central — G2 (Shneiderman 8 — reduzir carga cognitiva):** tooltip explica ícones/ações ambíguas sem ocupar espaço permanente na UI. Aparece só quando o usuário pede (hover/focus).

**G3 (acessibilidade):** Radix Tooltip ativa por hover **e** por foco de teclado, anunciando via ARIA.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const NoIconButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Caso de uso mais comum — explicar botões só com ícone (que precisam de `aria-label` mas a dica visual ajuda mouse/touch).",
      },
    },
  },
  render: () => (
    <div className="flex gap-2">
      <Tooltip content="Novo caderno">
        <Button size="icon" aria-label="Novo caderno">
          <Plus className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Configurações">
        <Button size="icon" variant="ghost" aria-label="Configurações">
          <Settings className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Precisa de ajuda?">
        <Button size="icon" variant="ghost" aria-label="Ajuda">
          <HelpCircle className="size-4" />
        </Button>
      </Tooltip>
    </div>
  ),
};

export const Posicoes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-2 place-items-center gap-12 p-12">
      <Tooltip content="Aparece em cima" side="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <Tooltip content="Aparece à direita" side="right">
        <Button variant="secondary">Right</Button>
      </Tooltip>
      <Tooltip content="Aparece embaixo" side="bottom">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Aparece à esquerda" side="left">
        <Button variant="secondary">Left</Button>
      </Tooltip>
    </div>
  ),
};

export const ConteudoRico: Story = {
  parameters: {
    docs: {
      description: {
        story: "Tooltip aceita ReactNode — útil pra atalhos com `kbd`.",
      },
    },
  },
  render: () => (
    <Tooltip
      content={
        <span className="flex items-center gap-2">
          Buscar
          <kbd className="bg-bg/20 rounded px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl+K
          </kbd>
        </span>
      }
    >
      <Button variant="secondary">Buscar</Button>
    </Tooltip>
  ),
};
