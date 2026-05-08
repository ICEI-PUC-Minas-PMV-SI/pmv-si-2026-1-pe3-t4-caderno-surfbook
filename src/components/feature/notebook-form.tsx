"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button/button";
import { IconSelector } from "@/components/ui/icon-selector/icon-selector";
import { ImageSelector } from "@/components/ui/image-selector/image-selector";
import { Input } from "@/components/ui/input/input";
import { Label } from "@/components/ui/label/label";
import { TagSelector } from "@/components/ui/tag-selector/tag-selector";
import type {
  CreateNotebookInput,
  Notebook,
  UpdateNotebookInput,
} from "@/services/notebook-service";
import { tagService } from "@/services/tag-service";
import type { Tag } from "@/types/tag";

export interface NotebookFormValues {
  name: string;
  description: string;
  iconName?: string;
  coverUrl?: string;
  tags: Tag[];
  /** Data ISO yyyy-mm-dd; vazia = sem prazo. */
  dueDate: string;
}

interface NotebookFormProps {
  /** Valores iniciais — modo "edit" quando presente */
  initial?: Notebook;
  /** Disparado no submit; recebe os valores normalizados */
  onSubmit: (values: NotebookFormValues) => Promise<void>;
  /** Texto do botão primário; default: "Criar caderno" / "Salvar alterações" */
  submitLabel?: string;
  /** Texto do botão durante loading */
  loadingLabel?: string;
  /** Callback do botão cancelar */
  onCancel: () => void;
}

export function NotebookForm({
  initial,
  onSubmit,
  submitLabel,
  loadingLabel,
  onCancel,
}: NotebookFormProps) {
  const nameId = useId();
  const descId = useId();
  const iconId = useId();
  const coverId = useId();
  const tagsId = useId();
  const dueDateId = useId();
  const errorId = useId();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [iconName, setIconName] = useState<string | undefined>(
    initial?.iconName
  );
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tagService.listAll().then(setTagSuggestions);
  }, []);

  const isEdit = !!initial;
  const primaryLabel =
    submitLabel ?? (isEdit ? "Salvar alterações" : "Criar caderno");
  const busyLabel = loadingLabel ?? (isEdit ? "Salvando…" : "Criando…");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe um nome para o caderno.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        iconName,
        coverUrl: coverUrl.trim() || undefined,
        tags,
        dueDate: dueDate.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar o caderno."
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={nameId} required>
          Nome
        </Label>
        <Input
          id={nameId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder="Ex.: Cálculo Diferencial"
          invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={descId}>Descrição</Label>
        <Input
          id={descId}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O que você vai estudar aqui?"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={iconId}>Ícone</Label>
        <IconSelector
          id={iconId}
          value={iconName}
          onChange={setIconName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={coverId}>Capa</Label>
        <ImageSelector
          value={coverUrl || undefined}
          onChange={(v) => setCoverUrl(v ?? "")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={tagsId}>Tags</Label>
        <TagSelector
          id={tagsId}
          value={tags}
          onChange={setTags}
          suggestions={tagSuggestions}
        />
        <p className="text-muted-foreground text-xs">
          Comece a digitar para reutilizar tags existentes ou pressione Enter
          para criar uma nova.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={dueDateId}>Data limite</Label>
        <Input
          id={dueDateId}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Opcional. Se definido, aparece no calendário e no painel de próximos
          prazos.
        </p>
      </div>

      {error && (
        <p id={errorId} className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {loading ? busyLabel : primaryLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Helpers para converter NotebookFormValues nos inputs dos services.
 */
export function toCreateInput(values: NotebookFormValues): CreateNotebookInput {
  return {
    name: values.name,
    description: values.description || undefined,
    iconName: values.iconName,
    coverUrl: values.coverUrl,
    tags: values.tags,
    dueDate: values.dueDate || undefined,
  };
}

export function toUpdateInput(values: NotebookFormValues): UpdateNotebookInput {
  return {
    name: values.name,
    description: values.description,
    iconName: values.iconName,
    coverUrl: values.coverUrl,
    tags: values.tags,
    // string vazia → null (limpa); preenchida → string
    dueDate: values.dueDate ? values.dueDate : null,
  };
}
