"use client";

import { BookOpen, Eye, EyeOff, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NotebookCard } from "@/components/feature/notebook-card";
import { Button } from "@/components/ui/button/button";
import { EmptyState } from "@/components/ui/empty-state/empty-state";
import { useToast } from "@/components/ui/toast/toast";
import { importNotebookFromZip } from "@/lib/notebook-import";
import {
  notebookService,
  type Notebook,
} from "@/services/notebook-service";

export default function CadernosPage() {
  const [notebooks, setNotebooks] = useState<Notebook[] | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const reload = useCallback(() => {
    notebookService.list().then(setNotebooks);
  }, []);

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const result = await importNotebookFromZip(file);
      toast({
        title: "Caderno importado",
        description: `“${result.notebook.name}” com ${result.noteCount} nota${result.noteCount === 1 ? "" : "s"}.`,
        variant: "success",
      });
      reload();
    } catch (err) {
      toast({
        title: "Falha ao importar",
        description:
          err instanceof Error
            ? err.message
            : "Verifique se o .zip está no formato esperado.",
        variant: "danger",
      });
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    reload();
  }, [reload]);

  const visible = useMemo(
    () =>
      notebooks
        ? showHidden
          ? notebooks
          : notebooks.filter((n) => !n.hidden)
        : null,
    [notebooks, showHidden]
  );

  const hiddenCount = useMemo(
    () => notebooks?.filter((n) => n.hidden).length ?? 0,
    [notebooks]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Cadernos
          </h1>
          <p className="text-muted-foreground">
            Seus cadernos de estudo organizados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = ""; // permite re-importar mesmo arquivo
            }}
          />
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            loading={importing}
          >
            <Upload className="size-4" aria-hidden />
            Importar .zip
          </Button>
          <Button asChild>
            <Link href="/cadernos/novo">
              <Plus className="size-4" aria-hidden />
              Novo caderno
            </Link>
          </Button>
        </div>
      </header>

      {visible === null && (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      )}

      {visible?.length === 0 && (
        <EmptyState
          icon={<BookOpen className="size-7" aria-hidden />}
          title={
            hiddenCount > 0 && !showHidden
              ? "Todos os cadernos estão ocultos"
              : "Nenhum caderno ainda"
          }
          description={
            hiddenCount > 0 && !showHidden
              ? `Você tem ${hiddenCount} caderno${hiddenCount === 1 ? "" : "s"} oculto${hiddenCount === 1 ? "" : "s"}. Mostre todos ou crie um novo.`
              : "Crie seu primeiro caderno pra começar a organizar seus estudos."
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/cadernos/novo">
                  <Plus className="size-4" aria-hidden />
                  Criar caderno
                </Link>
              </Button>
              {hiddenCount > 0 && !showHidden && (
                <Button
                  variant="secondary"
                  onClick={() => setShowHidden(true)}
                >
                  <Eye className="size-4" aria-hidden />
                  Mostrar ocultos
                </Button>
              )}
            </div>
          }
        />
      )}

      {visible && visible.length > 0 && (
        <>
          {hiddenCount > 0 && (
            <div className="text-muted-foreground -mt-2 flex items-center justify-end text-xs">
              <button
                type="button"
                onClick={() => setShowHidden((s) => !s)}
                className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                {showHidden ? (
                  <>
                    <EyeOff className="size-3" aria-hidden />
                    Esconder ocultos ({hiddenCount})
                  </>
                ) : (
                  <>
                    <Eye className="size-3" aria-hidden />
                    Mostrar ocultos ({hiddenCount})
                  </>
                )}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onUpdate={reload}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
