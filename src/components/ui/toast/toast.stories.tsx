import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../button/button";
import { ToastProvider, useToast } from "./toast";

const meta: Meta = {
  title: "Design System/Toast",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Princípio central — G2 (Shneiderman 4 — feedback informativo):** toast confirma resultado de uma ação sem interromper o fluxo do usuário (não-modal).

- **Sucesso (verde):** ações concluídas — "Caderno criado", "Salvo"
- **Danger (vermelho):** erros recuperáveis — "Não foi possível salvar"
- **Default:** info neutra

**G3 (acessibilidade):** Radix Toast usa \`role="status"\` (assertiva configurável); foco preservado no documento; swipe-to-dismiss + Esc.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function Demo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() =>
          toast({
            title: "Caderno criado",
            description: "Cálculo Diferencial está disponível em Cadernos.",
            variant: "success",
          })
        }
      >
        Sucesso
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast({
            title: "Não foi possível salvar",
            description: "Verifique sua conexão e tente novamente.",
            variant: "danger",
          })
        }
      >
        Erro
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "Atalho descoberto",
            description: "Use Cmd+K para buscar de qualquer tela.",
          })
        }
      >
        Default
      </Button>
    </div>
  );
}

export const Variantes: Story = {
  render: () => (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  ),
};
