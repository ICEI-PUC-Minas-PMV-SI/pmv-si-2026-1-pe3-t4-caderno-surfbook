import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Label } from "../label/label";
import { ImageSelector } from "./image-selector";

const meta: Meta<typeof ImageSelector> = {
  title: "Design System/ImageSelector",
  component: ImageSelector,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**Seletor de imagem com 3 fontes:**

- **URL** — colar link de imagem da web
- **Upload** — arquivo do dispositivo; comprimido (max 1200×800 JPEG @ 85%) e armazenado no localStorage como base64. **Sem upload externo.**
- **Buscar** — stub pra integração futura com Unsplash/Pexels

**Princípios aplicados:**
- **G2 Shneiderman 7 (controle):** três caminhos; usuário escolhe o que fizer sentido
- **G2 Shneiderman 4 (feedback):** "Comprimindo…", erros visíveis, preview imediato
- **G3 (acessibilidade):** \`role="tablist"\` com \`aria-pressed\`; input file acessível via label clicável
- **G4 (comunicabilidade):** microcopy explica armazenamento local sem ambiguidade

**Privacidade:** imagens uploadadas ficam só no navegador do usuário — alinhado com a abordagem mock-first do eixo-3.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageSelector>;

export const Vazio: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div className="w-96 space-y-1.5">
        <Label>Capa</Label>
        <ImageSelector value={value} onChange={setValue} />
      </div>
    );
  },
};

export const ComUrlPreenchida: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | undefined>(
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600"
    );
    return (
      <div className="w-96 space-y-1.5">
        <Label>Capa</Label>
        <ImageSelector value={value} onChange={setValue} />
      </div>
    );
  },
};
