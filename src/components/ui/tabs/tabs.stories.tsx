import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Calendar, FileText, ListTodo } from "lucide-react";

import { Tabs, TabsContent } from "./tabs";

const meta: Meta = {
  title: "Design System/Tabs",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Abas estilo pasta de arquivos (file folder). A aba ativa parece levantada e
mergulha no conteúdo abaixo via \`-mb-px\` + cor da borda inferior igual à
superfície de conteúdo.

**Por que essa metáfora?** O SurfBook é um produto de estudo — pastas e
fichários são objetos de escritório que carregam o mesmo conceito (folder
contém múltiplos itens de tipos diferentes). Aplicação direta da heurística
de **G2 Shneiderman 1 (consistência com o mundo real)**.

**Princípios aplicados:**
- **G1 Gestalt — similaridade:** todas as abas têm o mesmo formato, agrupando-as como sistema único
- **Affordance metafórica:** o formato sugere "puxe pra ver"
- **Information scent (Pirolli):** badges de contagem antecipam o que tem dentro
        `,
      },
    },
    nextjs: { navigation: { pathname: "/exemplo/notas" } },
  },
};

export default meta;
type Story = StoryObj;

export const Padrao: Story = {
  render: () => (
    <div>
      <Tabs
        tabs={[
          {
            href: "/exemplo/notas",
            label: "Notas",
            count: 12,
            icon: FileText,
          },
          {
            href: "/exemplo/tarefas",
            label: "Tarefas",
            count: 3,
            icon: ListTodo,
            disabled: true,
            hint: "em breve",
          },
          {
            href: "/exemplo/eventos",
            label: "Eventos",
            count: 0,
            icon: Calendar,
            disabled: true,
            hint: "em breve",
          },
        ]}
      />
      <TabsContent>
        <p className="text-foreground">
          Conteúdo da aba ativa. A borda da aba selecionada continua na borda
          deste container — efeito clássico de pasta de arquivos.
        </p>
      </TabsContent>
    </div>
  ),
};

export const SemContagem: Story = {
  render: () => (
    <div>
      <Tabs
        tabs={[
          { href: "/exemplo/visao", label: "Visão geral" },
          { href: "/exemplo/notas", label: "Notas" },
          { href: "/exemplo/historico", label: "Histórico" },
        ]}
      />
      <TabsContent>
        <p>Sem contagens — útil quando o número não é informativo.</p>
      </TabsContent>
    </div>
  ),
};
