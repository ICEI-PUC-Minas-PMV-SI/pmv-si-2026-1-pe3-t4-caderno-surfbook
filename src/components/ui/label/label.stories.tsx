import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useId } from "react";

import { Input } from "../input/input";
import { Label } from "./label";

const meta: Meta<typeof Label> = {
  title: "Design System/Label",
  component: Label,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G3 (acessibilidade):** sempre associado ao input via \`htmlFor\` — leitores de tela anunciam o rótulo ao focar; campos clicáveis no rótulo
- **G4 (comunicabilidade):** \`required\` mostra asterisco \`*\` em \`text-danger\` — sinal universal que o usuário reconhece
- **G2 (Shneiderman 1 — consistência):** mesmo tamanho/peso/cor em todos os formulários
        `,
      },
    },
  },
  argTypes: {
    required: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    children: "Email",
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Playground: Story = {};

export const Obrigatorio: Story = {
  args: { required: true, children: "Senha" },
};

export const ComInput: Story = {
  render: function Render() {
    const id = useId();
    return (
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor={id} required>
          Nome do caderno
        </Label>
        <Input id={id} placeholder="Ex.: Cálculo Diferencial" />
      </div>
    );
  },
};
