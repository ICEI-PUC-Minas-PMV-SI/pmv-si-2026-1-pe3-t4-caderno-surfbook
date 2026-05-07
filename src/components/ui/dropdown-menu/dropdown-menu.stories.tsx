import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Edit3, EyeOff, MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta: Meta = {
  title: "Design System/DropdownMenu",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G2 (Shneiderman 7 — controle):** abre só sob demanda; usuário fecha com Esc, click fora ou seleção
- **G2 (Shneiderman 3 — atalhos):** itens podem mostrar shortcut (\`DropdownMenuShortcut\`)
- **G3 (acessibilidade):** Radix navega com arrow keys; foco encadeado; \`aria-menu\` automático
- **G4 (comunicabilidade):** ícones acompanham rótulos; ações destrutivas em vermelho separadas das demais
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const MenuDeContextoDoCard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Antecipação do menu &ldquo;⋯&rdquo; que vai aparecer em cada NotebookCard.",
      },
    },
  },
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mais opções">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Caderno</DropdownMenuLabel>
        <DropdownMenuItem>
          <Edit3 className="size-4" aria-hidden />
          Editar
          <DropdownMenuShortcut>E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <EyeOff className="size-4" aria-hidden />
          Ocultar do menu
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 className="size-4" aria-hidden />
          Excluir
          <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const BotaoNovo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Antecipação do botão &ldquo;+ Novo&rdquo; global do Tier 4 — mesmo Dropdown, conteúdo diferente.",
      },
    },
  },
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          Novo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          Caderno
          <DropdownMenuShortcut>C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Nota
          <DropdownMenuShortcut>N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Tarefa
          <DropdownMenuShortcut>T</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
