import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Resolve E5** (hierarquia visual fraca do eixo-1) — variantes \`primary\` / \`secondary\` / \`ghost\` / \`destructive\` / \`link\` aplicam Gestalt figura-fundo distinto, fazendo a ação primária se destacar.

**Resolve E4** (microcopy genérica) — rótulos imperativos ("Novo caderno", "Criar caderno") em vez de "+Adicionar".

**Princípios aplicados:**
- **G1 (Gestalt — figura-fundo):** variante \`primary\` em \`brand-500\` cria contraste alto contra superfícies neutras
- **G2 (Shneiderman 4 — feedback informativo):** estados \`hover\` / \`active\` mudam tonalidade
- **G2 (Shneiderman 5 — prevenção de erro):** \`loading\` desabilita o botão e mostra spinner, evitando double-submit
- **G3 (acessibilidade):** \`focus-visible\` com \`outline\` brand-500 + offset; \`aria-busy\` durante loading; \`asChild\` mantém semântica correta ao usar como link
- **G4 (comunicabilidade):** ícones lucide com texto, nunca sozinhos exceto em \`size="icon"\` que exige \`aria-label\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg", "icon"],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    asChild: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    variant: "primary",
    size: "md",
    children: "Novo caderno",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Variantes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Cinco variantes que cobrem a hierarquia de ações: primária (CTA), secundária (cancelar), ghost (ações terciárias), destrutiva (excluir/sair), link (navegação inline).",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Criar caderno</Button>
      <Button variant="secondary">Cancelar</Button>
      <Button variant="ghost">Configurar</Button>
      <Button variant="destructive">Excluir</Button>
      <Button variant="link">Saiba mais</Button>
    </div>
  ),
};

export const Tamanhos: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Quatro tamanhos: `sm` para barras compactas, `md` (padrão) para formulários, `lg` para CTAs principais, `icon` para botões só com ícone (exige `aria-label`).",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Pequeno</Button>
      <Button size="md">Médio</Button>
      <Button size="lg">Grande</Button>
      <Button size="icon" aria-label="Novo item">
        <Plus className="size-4" />
      </Button>
    </div>
  ),
};

export const ComIcones: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Ícones (lucide-react) reforçam a ação textual — G4 comunicabilidade. Nunca substituem o texto exceto em `size=\"icon\"`.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus className="size-4" aria-hidden="true" />
        Novo caderno
      </Button>
      <Button variant="secondary">
        Continuar
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
      <Button variant="destructive">
        <Trash2 className="size-4" aria-hidden="true" />
        Excluir caderno
      </Button>
    </div>
  ),
};

export const Estados: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Padrão, desabilitado e loading. `loading` impede o usuário de submeter duas vezes — regra de ouro 5 (prevenção de erro).",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Padrão</Button>
      <Button disabled>Desabilitado</Button>
      <Button loading>Salvando…</Button>
      <Button variant="destructive" loading>
        Excluindo…
      </Button>
    </div>
  ),
};

export const ComoLink: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Com `asChild`, o Button transfere classes/variantes para um filho semântico (ex.: `<a>` ou `<Link>` do Next). Mantém acessibilidade de navegação — o elemento renderizado é um `<a>`, não um `<button>`.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild variant="primary">
        <a href="#cadernos">Abrir cadernos</a>
      </Button>
      <Button asChild variant="link">
        <a href="#tutorial">Ver tutorial</a>
      </Button>
    </div>
  ),
};

export const HierarquiaDeAcao: Story = {
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Aplicação real do princípio de figura-fundo (Gestalt) num modal: ação primária (criar) destaca-se; secundária (cancelar) recolhe-se. Usuário identifica a ação esperada em < 1s.",
      },
    },
  },
  render: () => (
    <div className="bg-surface w-96 space-y-4 rounded-lg border p-6 shadow-md">
      <div>
        <h3 className="font-display text-lg font-semibold">Excluir caderno?</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Esta ação não pode ser desfeita. Todas as notas dentro do caderno
          serão excluídas.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancelar</Button>
        <Button variant="destructive">
          <Trash2 className="size-4" aria-hidden="true" />
          Excluir
        </Button>
      </div>
    </div>
  ),
};
