import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useId, useState } from "react";

import { Button } from "../button/button";
import { Label } from "../label/label";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Design System/Input",
  component: Input,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G3 (acessibilidade):** \`focus-visible\` outline brand-500 com offset; \`aria-invalid\` setado quando \`invalid\`; usar com \`<Label htmlFor>\` (ver story "ComLabel")
- **G2 (Shneiderman 4 — feedback):** estado \`invalid\` muda borda e outline para \`danger\`, comunicando erro sem depender só de cor (texto auxiliar deve estar presente)
- **G2 (Shneiderman 5 — prevenção de erro):** \`disabled\` evita interação acidental
- **G4 (comunicabilidade):** placeholder dá pista do formato esperado mas nunca substitui label

**Resolve do eixo-1:** formulários do eixo-1 herdavam Bootstrap default sem foco visível claro; aqui o foco é parte do design system, não acidente.
        `,
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    type: {
      control: "inline-radio",
      options: ["text", "email", "password", "number", "search"],
    },
  },
  args: {
    size: "md",
    placeholder: "Digite aqui",
    type: "text",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Playground: Story = {};

export const Tamanhos: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <Input size="sm" placeholder="Pequeno" />
      <Input size="md" placeholder="Médio (padrão)" />
      <Input size="lg" placeholder="Grande" />
    </div>
  ),
};

export const Estados: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <Input placeholder="Padrão" />
      <Input placeholder="Desabilitado" disabled />
      <Input placeholder="Inválido" invalid defaultValue="texto inválido" />
      <Input placeholder="Somente leitura" readOnly defaultValue="só leitura" />
    </div>
  ),
};

export const Tipos: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <Input type="email" placeholder="seu@email.com" />
      <Input type="password" placeholder="Senha" />
      <Input type="number" placeholder="42" />
      <Input type="search" placeholder="Buscar cadernos…" />
    </div>
  ),
};

export const ComLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Composição mínima com `<Label htmlFor>` ligado ao `id` do Input via `useId()`. Acessibilidade nativa — leitores de tela anunciam o rótulo ao focar o input.",
      },
    },
  },
  render: function Render() {
    const id = useId();
    return (
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor={id} required>
          Email
        </Label>
        <Input id={id} type="email" placeholder="seu@email.com" />
      </div>
    );
  },
};

export const ComMensagemDeErro: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Mensagem de erro associada via `aria-describedby` — leitores de tela leem a explicação. Cor sozinha não é suficiente (G3 acessibilidade).",
      },
    },
  },
  render: function Render() {
    const id = useId();
    const errorId = `${id}-error`;
    return (
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor={id} required>
          Email
        </Label>
        <Input
          id={id}
          type="email"
          invalid
          defaultValue="email-invalido"
          aria-describedby={errorId}
        />
        <p id={errorId} className="text-danger text-sm" role="alert">
          Informe um email válido (ex.: <em>nome@dominio.com</em>).
        </p>
      </div>
    );
  },
};

export const FormularioDeLogin: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Antecipação de uso real — o futuro formulário de Login (Fase 3 / Tier 3) compõe `Label`, `Input` e `Button`.",
      },
    },
  },
  render: function Render() {
    const emailId = useId();
    const passId = useId();
    const [loading, setLoading] = useState(false);

    return (
      <form
        className="bg-surface w-80 space-y-4 rounded-lg border p-6 shadow-md"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => setLoading(false), 1500);
        }}
      >
        <header>
          <h2 className="font-display text-xl font-semibold">Entrar</h2>
          <p className="text-muted-foreground text-sm">
            Bem-vindo de volta ao SurfBook.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={emailId} required>
            Email
          </Label>
          <Input
            id={emailId}
            type="email"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={passId} required>
            Senha
          </Label>
          <Input id={passId} type="password" placeholder="••••••••" required />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    );
  },
};
