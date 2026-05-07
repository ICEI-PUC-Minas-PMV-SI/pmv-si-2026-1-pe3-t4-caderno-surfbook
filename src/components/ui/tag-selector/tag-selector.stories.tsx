import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Label } from "../label/label";
import {
  TagSelector,
  colorForTagName,
  randomTagColor,
  type Tag,
} from "./tag-selector";

const meta: Meta<typeof TagSelector> = {
  title: "Design System/TagSelector",
  component: TagSelector,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G4 (comunicabilidade):** padrão "type + Enter" universalmente reconhecido; placeholder explica
- **G2 (Shneiderman 7 — controle):** Backspace remove última tag (atalho); X em cada chip
- **G1 (Gestalt — similaridade):** mesma tag tem mesma cor sempre (hash determinístico do nome) — usuário aprende rápido a reconhecer suas categorias
- **G2 (Shneiderman 4 — feedback):** chip aparece imediatamente ao confirmar; cor reforça que foi adicionado

**Resolve do eixo-1:** mesmo padrão de "Enter para adicionar tag" do componente original, agora com cores determinísticas e a11y melhorada.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TagSelector>;

export const Default: Story = {
  render: function Render() {
    const [tags, setTags] = useState<Tag[]>([
      { id: "1", name: "matemática", color: colorForTagName("matemática") },
      { id: "2", name: "cálculo", color: colorForTagName("cálculo") },
    ]);
    return (
      <div className="w-96 space-y-1.5">
        <Label>Tags</Label>
        <TagSelector value={tags} onChange={setTags} />
        <p className="text-muted-foreground text-xs">
          Pressione Enter ou vírgula para adicionar. Backspace remove a última.
        </p>
      </div>
    );
  },
};

export const Vazio: Story = {
  render: function Render() {
    const [tags, setTags] = useState<Tag[]>([]);
    return (
      <div className="w-96 space-y-1.5">
        <Label>Tags</Label>
        <TagSelector value={tags} onChange={setTags} />
      </div>
    );
  },
};

export const CoresPredefinidas: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Cores são derivadas do nome via hash determinístico — mesma tag sempre tem mesma cor, permitindo reconhecimento visual rápido.",
      },
    },
  },
  render: function Render() {
    const [tags, setTags] = useState<Tag[]>(
      ["javascript", "python", "matemática", "design", "história"].map(
        (name, i) => ({
          id: String(i),
          name,
          color: colorForTagName(name),
        })
      )
    );
    return (
      <div className="w-96 space-y-1.5">
        <Label>Tags do caderno</Label>
        <TagSelector value={tags} onChange={setTags} />
      </div>
    );
  },
};
