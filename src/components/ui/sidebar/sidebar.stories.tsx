import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  BookOpen,
  Calendar,
  FileText,
  Home,
  ListTodo,
  Network,
  Settings,
} from "lucide-react";

import { Button } from "../button/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "./sidebar";

const meta: Meta = {
  title: "Design System/Sidebar",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G2 (Shneiderman 1 — consistência):** mesma sidebar em todas as telas autenticadas
- **G1 (Gestalt — proximidade):** itens agrupados em seções com título
- **G3 (acessibilidade):** \`aria-current="page"\` no item ativo; foco visível
- **G4 (comunicabilidade):** rótulos curtos e imperativos; hints "(em breve)" para itens desabilitados
- **Resolve E3** do eixo-1: sidebar limpa, sem sufixos "+" inconsistentes; criação fica fora dela (no botão global "+ Novo" do Topbar)
        `,
      },
    },
    nextjs: {
      navigation: {
        pathname: "/cadernos",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Completo: Story = {
  render: () => (
    <Sidebar>
      <SidebarHeader>
        <span className="font-display text-lg font-semibold">
          <span className="text-brand-500 font-normal">Surf</span>
          <span className="text-brand-700">Book.</span>
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection title="Navegação">
          <SidebarItem href="/" icon={Home}>
            Início
          </SidebarItem>
          <SidebarItem href="/cadernos" icon={BookOpen}>
            Cadernos
          </SidebarItem>
          <SidebarItem href="/notas" icon={FileText} disabled hint="em breve">
            Notas
          </SidebarItem>
          <SidebarItem href="/tarefas" icon={ListTodo} disabled hint="em breve">
            Tarefas
          </SidebarItem>
          <SidebarItem
            href="/calendario"
            icon={Calendar}
            disabled
            hint="em breve"
          >
            Calendário
          </SidebarItem>
          <SidebarItem href="/grafo" icon={Network} disabled hint="em breve">
            Grafo
          </SidebarItem>
        </SidebarSection>
        <SidebarSection title="Conta">
          <SidebarItem
            href="/configuracoes"
            icon={Settings}
            disabled
            hint="em breve"
          >
            Configurações
          </SidebarItem>
        </SidebarSection>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Eric Nash</span>
            <span className="text-muted-foreground text-xs">
              eric@surfbook.com
            </span>
          </div>
          <Button variant="ghost" size="sm">
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  ),
};
