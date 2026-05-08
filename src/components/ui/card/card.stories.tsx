import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Book, MoreHorizontal } from "lucide-react";

import { Button } from "../button/button";
import { Badge } from "../badge/badge";
import {
  Card,
  CardContent,
  CardCover,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta: Meta<typeof Card> = {
  title: "Design System/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Princípio central — G1 (Gestalt — proximidade):** o Card agrupa visualmente informações que pertencem à mesma entidade (ex.: caderno, nota). O usuário reconhece "isso é uma coisa só" sem precisar ler.

**Estrutura composta** (\`CardHeader\` / \`CardTitle\` / \`CardDescription\` / \`CardContent\` / \`CardFooter\`) reforça **G2 (Shneiderman 1 — consistência):** todo card no app tem o mesmo ritmo visual.

**Variante \`interactive\`** acrescenta hover com sombra+borda — affordance clara de que é clicável (G1 figura-fundo dinâmica).
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Padrao: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Sobre proximidade</CardTitle>
        <CardDescription>
          Elementos próximos são percebidos como pertencentes ao mesmo grupo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Este card agrupa título, descrição e conteúdo de forma que o leitor
          processa como uma única unidade.
        </p>
      </CardContent>
    </Card>
  ),
};

export const Interativo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Variante usada para itens da lista de cadernos — hover reforça affordance.",
      },
    },
  },
  render: () => (
    <Card variant="interactive" className="w-80" tabIndex={0}>
      <CardHeader>
        <CardTitle>Cálculo Diferencial</CardTitle>
        <CardDescription>
          Limites, derivadas e aplicações em problemas físicos.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Badge color="#0dcaf0">Matemática</Badge>
        <Badge color="#fd7e14">Engenharia</Badge>
      </CardFooter>
    </Card>
  ),
};

export const NotebookCard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Composição que será o `NotebookCard` real — header com ícone, título, descrição; footer com tags. Demonstra como o sistema usa Card + Badge para a unidade visual da Lista de Cadernos.",
      },
    },
  },
  render: () => (
    <Card variant="interactive" className="w-80">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="bg-brand-100 text-brand-700 flex size-10 items-center justify-center rounded">
            <Book className="size-5" aria-hidden="true" />
          </div>
          <Button variant="ghost" size="icon" aria-label="Mais opções">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
        <CardTitle>Lógica de Programação</CardTitle>
        <CardDescription>
          Estruturas de controle, funções e manipulação de arrays em JavaScript.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Badge color="#0dcaf0">JavaScript</Badge>
        <Badge color="#fd7e14">Iniciante</Badge>
      </CardFooter>
    </Card>
  ),
};

export const ComCapaImagem: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Capa com imagem (estilo Trello) — `<CardCover src=...>` renderiza imagem flush nas bordas do card. Usar para entidades que carregam identidade visual (cadernos, projetos, eventos).",
      },
    },
  },
  render: () => (
    <Card variant="interactive" className="w-80">
      <CardCover
        src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600"
        alt="Capa do caderno"
        height="md"
      />
      <CardHeader>
        <CardTitle>Algoritmos e Estruturas</CardTitle>
        <CardDescription>
          Listas, árvores, grafos e análise de complexidade.
        </CardDescription>
      </CardHeader>
    </Card>
  ),
};

export const ComCapaCor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Capa com cor sólida — fallback elegante quando o usuário não tem URL de imagem. Cada caderno mantém identidade visual única.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Card variant="interactive">
        <CardCover color="#145AF1" height="md" />
        <CardHeader>
          <CardTitle className="text-base">Cálculo I</CardTitle>
          <CardDescription>Limites e derivadas.</CardDescription>
        </CardHeader>
      </Card>
      <Card variant="interactive">
        <CardCover color="#16A34A" height="md" />
        <CardHeader>
          <CardTitle className="text-base">Banco de Dados</CardTitle>
          <CardDescription>SQL e modelagem.</CardDescription>
        </CardHeader>
      </Card>
      <Card variant="interactive">
        <CardCover color="#DC2626" height="md" />
        <CardHeader>
          <CardTitle className="text-base">Redes</CardTitle>
          <CardDescription>TCP/IP e protocolos.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
};

export const AlturasDeCapa: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Três alturas: `sm` (16) para listas densas, `md` (24) padrão, `lg` (36) para destaque/hero.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardCover color="#145AF1" height="sm" />
        <CardHeader>
          <CardTitle className="text-base">sm</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardCover color="#145AF1" height="md" />
        <CardHeader>
          <CardTitle className="text-base">md</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardCover color="#145AF1" height="lg" />
        <CardHeader>
          <CardTitle className="text-base">lg</CardTitle>
        </CardHeader>
      </Card>
    </div>
  ),
};

export const GridDeCadernos: Story = {
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "Antecipação visual da página `/cadernos` — grid responsivo de cards. Em telas pequenas, vira coluna única (sem perder hierarquia).",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {[
        {
          title: "Cálculo Diferencial",
          desc: "Limites, derivadas e aplicações.",
          tags: [{ name: "Matemática", color: "#0dcaf0" }],
        },
        {
          title: "Lógica de Programação",
          desc: "Estruturas de controle e funções.",
          tags: [
            { name: "JavaScript", color: "#fd7e14" },
            { name: "Iniciante", color: "#198754" },
          ],
        },
        {
          title: "Banco de Dados",
          desc: "SQL, modelagem relacional e normalização.",
          tags: [{ name: "Dados", color: "#6f42c1" }],
        },
      ].map((nb) => (
        <Card key={nb.title} variant="interactive">
          <CardHeader>
            <div className="bg-brand-100 text-brand-700 flex size-10 items-center justify-center rounded">
              <Book className="size-5" aria-hidden="true" />
            </div>
            <CardTitle>{nb.title}</CardTitle>
            <CardDescription>{nb.desc}</CardDescription>
          </CardHeader>
          <CardFooter>
            {nb.tags.map((t) => (
              <Badge key={t.name} color={t.color}>
                {t.name}
              </Badge>
            ))}
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
};
