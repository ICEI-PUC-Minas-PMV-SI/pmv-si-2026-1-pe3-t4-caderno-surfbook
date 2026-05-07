"use client";

import { Link2, Search, Upload, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { cn } from "@/lib/utils";

type Source = "url" | "upload" | "search";

interface ImageSelectorProps {
  /** URL ou data URL (base64) */
  value?: string;
  onChange: (value: string | undefined) => void;
  /** Altura da pré-visualização (default: md) */
  previewHeight?: "sm" | "md" | "lg";
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB pré-compressão

/**
 * Comprime imagem via canvas — limita dimensões e qualidade pra caber no
 * localStorage (~5-10MB total). Saída: data URL JPEG.
 */
async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.85
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Imagem inválida."));
    el.src = dataUrl;
  });

  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
  const width = Math.round(img.width * ratio);
  const height = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste navegador.");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

const previewHeights = {
  sm: "h-16",
  md: "h-24",
  lg: "h-36",
};

/**
 * Seletor de imagem com 3 fontes:
 * - **URL**: cola um link da web
 * - **Upload**: arquivo do dispositivo, comprimido e armazenado em localStorage como base64
 * - **Buscar**: stub para integração futura (Unsplash/Pexels)
 *
 * **Princípios aplicados:**
 * - **G2 Shneiderman 7 (controle do usuário):** três caminhos válidos; usuário escolhe
 * - **G2 Shneiderman 4 (feedback):** progresso e erros explícitos; pré-visualização imediata
 * - **G3 (acessibilidade):** input file via label clicável; `aria-pressed` nas tabs
 * - **G4 (comunicabilidade):** ícones + texto em cada tab; microcopy explica armazenamento local
 *
 * Sem upload externo. Imagens ficam só no navegador do usuário.
 */
export function ImageSelector({
  value,
  onChange,
  previewHeight = "md",
  className,
}: ImageSelectorProps) {
  const [source, setSource] = React.useState<Source>(() =>
    value?.startsWith("data:") ? "upload" : "url"
  );
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      );
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clear() {
    onChange(undefined);
    setError(null);
  }

  const sourceTabs: { value: Source; label: string; icon: typeof Link2 }[] = [
    { value: "url", label: "URL", icon: Link2 },
    { value: "upload", label: "Upload", icon: Upload },
    { value: "search", label: "Buscar", icon: Search },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="bg-muted/40 inline-flex rounded p-0.5"
        role="tablist"
        aria-label="Fonte da imagem"
      >
        {sourceTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = source === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-pressed={isActive}
              onClick={() => {
                setSource(tab.value);
                setError(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                isActive
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {source === "url" && (
        <div className="space-y-1">
          <Input
            type="url"
            value={value && !value.startsWith("data:") ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="https://…"
            inputMode="url"
            autoComplete="off"
          />
          <p className="text-muted-foreground text-xs">
            Cole o link de uma imagem da web.
          </p>
        </div>
      )}

      {source === "upload" && (
        <div className="space-y-1">
          <label
            htmlFor={React.useId()}
            className={cn(
              "border-border bg-surface flex h-20 cursor-pointer items-center justify-center gap-2 rounded border border-dashed text-sm transition-colors",
              "hover:bg-muted hover:border-brand-300",
              uploading && "cursor-progress opacity-60"
            )}
          >
            <Upload className="size-4" aria-hidden />
            {uploading ? "Comprimindo…" : "Clique para escolher um arquivo"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              disabled={uploading}
            />
          </label>
          <p className="text-muted-foreground text-xs">
            Armazenado localmente no navegador (sem envio externo). Imagem é
            redimensionada para até 1200×800 e convertida em JPEG para economizar
            espaço.
          </p>
        </div>
      )}

      {source === "search" && (
        <div className="bg-muted/40 flex flex-col items-center gap-2 rounded p-6 text-center">
          <Search className="text-muted-foreground size-6" aria-hidden />
          <p className="text-foreground text-sm font-medium">
            Busca de imagens — em breve
          </p>
          <p className="text-muted-foreground text-xs">
            Próxima atualização: integração com Unsplash/Pexels para encontrar
            imagens livres direto daqui.
          </p>
        </div>
      )}

      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      {value && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">Pré-visualização</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="h-7 px-2 text-xs"
            >
              <X className="size-3" aria-hidden />
              Remover
            </Button>
          </div>
          <div
            className={cn(
              "bg-muted relative overflow-hidden rounded",
              previewHeights[previewHeight]
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Pré-visualização da capa"
              className="size-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                setError("Não foi possível carregar a imagem desta URL.");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
