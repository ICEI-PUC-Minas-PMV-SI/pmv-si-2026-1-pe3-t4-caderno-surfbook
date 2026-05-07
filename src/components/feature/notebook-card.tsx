"use client";

import {
  Edit3,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DeleteNotebookDialog } from "@/components/feature/delete-notebook-dialog";
import { EditNotebookDialog } from "@/components/feature/edit-notebook-dialog";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import {
  Card,
  CardCover,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";
import { useToast } from "@/components/ui/toast/toast";
import { getIconComponent } from "@/lib/icons";
import { notebookService, type Notebook } from "@/services/notebook-service";

interface NotebookCardProps {
  notebook: Notebook;
  onUpdate?: () => void;
}

export function NotebookCard({ notebook, onUpdate }: NotebookCardProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function toggleHidden() {
    try {
      await notebookService.update(notebook.id, { hidden: !notebook.hidden });
      toast({
        title: notebook.hidden
          ? "Caderno restaurado"
          : "Caderno ocultado",
        description: notebook.hidden
          ? `“${notebook.name}” voltou a aparecer na lista.`
          : `“${notebook.name}” foi ocultado. Use Cmd+K para restaurar.`,
        variant: "success",
      });
      onUpdate?.();
    } catch (err) {
      toast({
        title: "Não foi possível atualizar",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    }
  }

  const Icon = getIconComponent(notebook.iconName);
  const hasCover = !!notebook.coverUrl;
  const tags = notebook.tags ?? [];

  return (
    <>
      <div className="group relative">
        <Link
          href={`/cadernos/${notebook.id}`}
          className="block rounded-lg focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          aria-label={`Abrir caderno ${notebook.name}`}
        >
          <Card variant="interactive" className="h-full">
            {hasCover && (
              <CardCover
                height="md"
                src={notebook.coverUrl}
                alt={`Capa do caderno ${notebook.name}`}
              >
                {Icon && (
                  <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded bg-white/90 text-brand-700 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                    <Icon className="size-5" aria-hidden />
                  </div>
                )}
              </CardCover>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                {!hasCover && Icon && (
                  <div className="bg-brand-100 text-brand-700 flex size-8 items-center justify-center rounded">
                    <Icon className="size-4" aria-hidden />
                  </div>
                )}
                <CardTitle className="flex-1 text-base">
                  {notebook.name}
                </CardTitle>
                {notebook.system && (
                  <Badge variant="brand" className="shrink-0">
                    Tutorial
                  </Badge>
                )}
              </div>
              {notebook.description && (
                <CardDescription className="line-clamp-2">
                  {notebook.description}
                </CardDescription>
              )}
            </CardHeader>
            {tags.length > 0 && (
              <CardFooter className="flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag.id} color={tag.color}>
                    {tag.name}
                  </Badge>
                ))}
              </CardFooter>
            )}
          </Card>
        </Link>

        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Mais opções de ${notebook.name}`}
                className="size-8 bg-white/85 shadow-sm ring-1 ring-black/5 backdrop-blur-sm hover:bg-white"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Edit3 className="size-4" aria-hidden />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={toggleHidden}>
                {notebook.hidden ? (
                  <>
                    <Eye className="size-4" aria-hidden />
                    Mostrar no menu
                  </>
                ) : (
                  <>
                    <EyeOff className="size-4" aria-hidden />
                    Ocultar do menu
                  </>
                )}
              </DropdownMenuItem>
              {!notebook.system && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(true)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditNotebookDialog
        open={editing}
        onOpenChange={setEditing}
        notebook={notebook}
        onSuccess={onUpdate}
      />
      <DeleteNotebookDialog
        open={deleting}
        onOpenChange={setDeleting}
        notebook={notebook}
        onSuccess={onUpdate}
      />
    </>
  );
}
