import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hash } from "lucide-react";

import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "Design System/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G1 (Gestalt — similaridade):** badges com mesma cor formam grupo perceptivo (ex.: tags da mesma família).
- **G2 (Shneiderman 1 — consistência):** mesmo formato e tamanho em todo o app.
- **G3 (acessibilidade):** sempre acompanhado de texto, nunca cor sozinha.

**Variantes** cobrem estados/categorias semânticas. Para **tags de caderno** (que carregam cor própria do usuário), usar a prop \`color="#hex"\` que sobrepõe a variante.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["neutral", "brand", "success", "warning", "danger"],
    },
    color: { control: "color" },
    children: { control: "text" },
  },
  args: {
    variant: "neutral",
    children: "Tag",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {};

export const Variantes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="brand">Brand</Badge>
      <Badge variant="success">Concluído</Badge>
      <Badge variant="warning">Em revisão</Badge>
      <Badge variant="danger">Atrasado</Badge>
    </div>
  ),
};

export const ComIcone: Story = {
  render: () => (
    <Badge variant="brand">
      <Hash className="size-3" aria-hidden="true" />
      programação
    </Badge>
  ),
};

export const TagsDeCaderno: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tags com cor customizada — herdadas do modelo de dados do eixo-1 (cada tag carrega seu hex). Texto sempre branco; cabe ao usuário escolher cores legíveis.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge color="#0dcaf0">Dados</Badge>
      <Badge color="#fd7e14">Lógica</Badge>
      <Badge color="#198754">JavaScript</Badge>
      <Badge color="#6f42c1">Backend</Badge>
      <Badge color="#dc3545">Urgente</Badge>
    </div>
  ),
};
