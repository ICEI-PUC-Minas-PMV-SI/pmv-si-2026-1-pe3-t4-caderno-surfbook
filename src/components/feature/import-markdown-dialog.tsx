"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/dialog";
import { Input } from "@/components/ui/input/input";
import { Label } from "@/components/ui/label/label";
import { useToast } from "@/components/ui/toast/toast";
import { markdownToNodes } from "@/lib/markdown-nodes";
import { noteService } from "@/services/note-service";

interface ImportMarkdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  /** Callback após criação bem-sucedida — recebe o id da nova nota. */
  onCreated?: (noteId: string) => void;
}

const PLACEHOLDER = `# Título da nota

Conteúdo introdutório...

- Item de lista
- [ ] Tarefa pendente
- [x] Tarefa concluída

> Citação importante`;

export function ImportMarkdownDialog({
  open,
  onOpenChange,
  notebookId,
  onCreated,
}: ImportMarkdownDialogProps) {
  const { toast } = useToast();
  const titleId = useId();
  const mdId = useId();

  const [title, setTitle] = useState("");
  const [md, setMd] = useState("");
  const [creating, setCreating] = useState(false);

  function reset() {
    setTitle("");
    setMd("");
    setCreating(false);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const nodes = markdownToNodes(md);
      const created = await noteService.create({
        notebookId,
        title: title.trim() || undefined,
        nodes,
      });
      toast({
        title: "Nota importada",
        description: `“${created.title || "Sem título"}” criada com ${nodes.length} ${
          nodes.length === 1 ? "bloco" : "blocos"
        }.`,
        variant: "success",
      });
      reset();
      onOpenChange(false);
      onCreated?.(created.id);
    } catch (err) {
      toast({
        title: "Não foi possível importar",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
      setCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar de Markdown</DialogTitle>
          <DialogDescription>
            Cole conteúdo em Markdown — vai virar blocos editáveis. Útil para
            trazer notas do Notion, Obsidian ou de qualquer arquivo .md.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={titleId}>Título</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="(opcional — deixe vazio para extrair do primeiro #)"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={mdId} required>
              Conteúdo (Markdown)
            </Label>
            <textarea
              id={mdId}
              value={md}
              onChange={(e) => setMd(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder={PLACEHOLDER}
              className="bg-bg border-border placeholder:text-muted-foreground/40 w-full resize-y rounded border p-3 font-mono text-sm leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            />
            <p className="text-muted-foreground text-xs">
              Suporta títulos, listas, checklists, citações, código e imagens.
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={creating}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleCreate} loading={creating} disabled={!md.trim()}>
            {creating ? "Importando…" : "Importar e criar nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
