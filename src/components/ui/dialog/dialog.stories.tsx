import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "../button/button";
import { Input } from "../input/input";
import { Label } from "../label/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta: Meta = {
  title: "Design System/Dialog",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
**Princípios aplicados:**
- **G2 (Shneiderman 5 — prevenção de erro):** ações destrutivas confirmam antes de executar; cancelar sempre disponível
- **G2 (Shneiderman 7 — controle do usuário):** Esc, X e click no overlay fecham; foco volta pro gatilho
- **G3 (acessibilidade):** Radix faz focus trap; \`role="dialog"\` + \`aria-modal\` automáticos; Title/Description vinculados via aria-labelledby/describedby
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const FormularioDeEdicao: Story = {
  render: function Render() {
    const nameId = useId();
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Editar caderno</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar caderno</DialogTitle>
            <DialogDescription>
              Atualize o nome e a descrição. As alterações são salvas
              imediatamente.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={nameId} required>
                Nome
              </Label>
              <Input id={nameId} defaultValue="Cálculo Diferencial" />
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const ConfirmacaoDestrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Padrão para ações irreversíveis — copy explícita do que será perdido + ação primária em variante `destructive`. Nunca com ação destrutiva como default.",
      },
    },
  },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="size-4" aria-hidden />
            Excluir caderno
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir &ldquo;Cálculo Diferencial&rdquo;?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todas as notas dentro do caderno
              também serão excluídas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => setOpen(false)}
            >
              <Trash2 className="size-4" aria-hidden />
              Sim, excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
