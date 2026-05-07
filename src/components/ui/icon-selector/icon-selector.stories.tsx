import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Label } from "../label/label";
import { IconSelector } from "./icon-selector";

const meta: Meta<typeof IconSelector> = {
  title: "Design System/IconSelector",
  component: IconSelector,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G2 (Shneiderman 7 — controle):** popover abre só sob demanda; usuário fecha clicando fora ou Esc
- **G2 (Shneiderman 8 — reduzir carga):** busca por nome + palavras-chave em PT-BR (ex.: "matemática" encontra \`calculator\`)
- **G3 (acessibilidade):** \`role="listbox"\` no grid, \`aria-selected\` em cada opção, \`aria-label\` por ícone, foco visível em tudo
- **G4 (comunicabilidade):** ícone + nome no trigger; opção "Remover ícone" explícita

**Resolve do eixo-1:** ícones eram escolhidos via componente próprio que listava ícones do Bootstrap; agora é um padrão Radix com busca, busca em português e a11y nativa.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconSelector>;

export const Default: Story = {
  render: function Render() {
    const [icon, setIcon] = useState<string | undefined>("graduation-cap");
    return (
      <div className="w-72 space-y-1.5">
        <Label>Ícone do caderno</Label>
        <IconSelector value={icon} onChange={setIcon} />
        <p className="text-muted-foreground text-xs">
          Selecionado: <code className="text-foreground">{icon ?? "nenhum"}</code>
        </p>
      </div>
    );
  },
};

export const SemIcone: Story = {
  render: function Render() {
    const [icon, setIcon] = useState<string | undefined>(undefined);
    return (
      <div className="w-72 space-y-1.5">
        <Label>Ícone do caderno</Label>
        <IconSelector value={icon} onChange={setIcon} />
      </div>
    );
  },
};
