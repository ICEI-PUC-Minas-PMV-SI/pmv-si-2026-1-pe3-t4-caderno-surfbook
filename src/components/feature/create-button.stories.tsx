import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CreateButton } from "./create-button";

const meta: Meta<typeof CreateButton> = {
  title: "Feature/CreateButton",
  component: CreateButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Botão global "+ Novo"** — peça crítica que ataca o problema de descoberta
de features (E1 do diagnóstico do eixo-1).

Sempre disponível no Topbar. O usuário não precisa estar na página de
listagem pra criar; clica de qualquer tela e escolhe o tipo.

**Princípios aplicados:**
- G2 Shneiderman 1 (consistência) — mesmo lugar em toda tela
- G2 Shneiderman 3 (atalhos) — atalhos visíveis no menu
- G4 (comunicabilidade) — rótulos por tipo, ícones reforçando
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CreateButton>;

export const Default: Story = {};
