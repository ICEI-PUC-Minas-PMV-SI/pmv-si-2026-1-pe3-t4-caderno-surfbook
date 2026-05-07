import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, FileQuestion, Plus } from "lucide-react";

import { Button } from "../button/button";
import { EmptyState } from "./empty-state";

const meta: Meta<typeof EmptyState> = {
  title: "Design System/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Padrão para listas/áreas vazias. Sempre oferece próxima ação clara.

**Resolve E6** do eixo-1: estados vazios eram só imagem solta + texto plano. Aqui há um padrão consistente que combina ícone + título + descrição + CTA + dica de atalho.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const ListaDeCadernosVazia: Story = {
  render: () => (
    <EmptyState
      icon={<BookOpen className="size-7" aria-hidden />}
      title="Nenhum caderno ainda"
      description="Crie seu primeiro caderno pra começar a organizar seus estudos. Cada caderno reúne notas relacionadas e ajuda a revisitar o que você já aprendeu."
      action={
        <Button>
          <Plus className="size-4" aria-hidden />
          Criar primeiro caderno
        </Button>
      }
      hint="Dica: pressione Cmd+K para abrir o buscador rápido."
    />
  ),
};

export const SemResultadosBusca: Story = {
  render: () => (
    <EmptyState
      icon={<FileQuestion className="size-7" aria-hidden />}
      title="Nenhum resultado"
      description="Não encontramos cadernos ou notas com esse termo. Tente com outra palavra-chave."
    />
  ),
};
