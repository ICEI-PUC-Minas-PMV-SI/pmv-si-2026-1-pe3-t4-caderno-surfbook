import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";

import { CreateButton } from "../../feature/create-button";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { Topbar, TopbarLeft, TopbarRight } from "./topbar";

const meta: Meta = {
  title: "Design System/Topbar",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G2 (Shneiderman 1 — consistência):** topbar igual em todas as telas; usuário sempre acha o "+ Novo" e a busca no mesmo lugar
- **G1 (Gestalt — proximidade):** ações de criação agrupadas no canto direito
- **Resolve E1** do eixo-1: o botão de criar é global, não mais preso à página de listagem
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ComBuscaEBotaoNovo: Story = {
  render: () => (
    <div className="bg-bg min-h-40">
      <Topbar>
        <TopbarLeft>
          <h1 className="font-display text-base font-semibold">Cadernos</h1>
        </TopbarLeft>
        <TopbarRight>
          <div className="relative">
            <Search
              className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Buscar cadernos…"
              className="w-64 pl-8"
              size="sm"
            />
          </div>
          <CreateButton />
          <Button variant="ghost" size="sm">
            Sair
          </Button>
        </TopbarRight>
      </Topbar>
    </div>
  ),
};
