"use client";

import { Link2 } from "lucide-react";

import { parseInline } from "@/lib/inline-markdown";
import { cn } from "@/lib/utils";
import type { NoteNode } from "@/services/note-service";

interface NoteNodeRendererProps {
  node: NoteNode;
}

/**
 * Renderiza um único bloco de nota em modo somente-leitura.
 * Usado pela página pública de compartilhamento e por previews onde edição
 * inline não é apropriada.
 *
 * Faz parsing de Markdown inline (negrito, itálico, sublinhado, código,
 * tachado) via `parseInline`.
 */
export function NoteNodeRenderer({ node }: NoteNodeRendererProps) {
  switch (node.type) {
    case "heading": {
      const sizes = {
        1: "text-3xl",
        2: "text-2xl",
        3: "text-xl",
      } as const;
      const Tag = `h${node.level}` as "h1" | "h2" | "h3";
      return (
        <Tag
          className={cn(
            "font-display font-semibold tracking-tight",
            sizes[node.level]
          )}
        >
          {parseInline(node.text)}
        </Tag>
      );
    }

    case "paragraph": {
      const lines = node.text.split("\n");
      return (
        <p className="text-base leading-relaxed">
          {lines.map((line, i) => (
            <span key={i}>
              {parseInline(line)}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    }

    case "list":
      return node.ordered ? (
        <ol className="ml-6 list-decimal space-y-1">
          {node.items.map((item, i) => (
            <li
              key={i}
              style={{ marginLeft: `${item.indent * 1.5}rem` }}
            >
              {parseInline(item.text)}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="ml-6 list-disc space-y-1">
          {node.items.map((item, i) => (
            <li
              key={i}
              style={{ marginLeft: `${item.indent * 1.5}rem` }}
            >
              {parseInline(item.text)}
            </li>
          ))}
        </ul>
      );

    case "checklist":
      return (
        <ul className="space-y-1">
          {node.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2"
              style={{ paddingLeft: `${item.indent * 1.5}rem` }}
            >
              <input
                type="checkbox"
                checked={item.checked}
                readOnly
                aria-label={item.text}
                className="border-border accent-brand-500 mt-1.5 size-3.5 rounded"
              />
              <span
                className={cn(
                  item.checked && "text-muted-foreground line-through"
                )}
              >
                {node.ordered && (
                  <span className="text-muted-foreground mr-1">
                    {i + 1}.
                  </span>
                )}
                {parseInline(item.text)}
              </span>
            </li>
          ))}
        </ul>
      );

    case "image":
      return (
        <figure className="overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.url}
            alt={node.alt ?? ""}
            className="max-w-full"
          />
          {node.alt && (
            <figcaption className="text-muted-foreground mt-1 text-xs">
              {node.alt}
            </figcaption>
          )}
        </figure>
      );

    case "quote": {
      const lines = node.text.split("\n");
      return (
        <blockquote className="border-brand-300 text-muted-foreground border-l-4 pl-4 italic">
          {lines.map((line, i) => (
            <p key={i}>{line ? parseInline(line) : " "}</p>
          ))}
        </blockquote>
      );
    }

    case "code":
      return (
        <pre className="bg-muted overflow-x-auto rounded p-4">
          {node.language && (
            <div className="text-muted-foreground mb-2 font-mono text-xs">
              {node.language}
            </div>
          )}
          <code className="font-mono text-sm whitespace-pre">{node.code}</code>
        </pre>
      );

    case "divider":
      return <hr className="border-border" />;

    case "bookmark":
      return (
        <div className="bg-muted/30 text-muted-foreground flex items-center gap-2 rounded border p-3 text-sm">
          <Link2 className="size-4" aria-hidden />
          <span>
            Link interno —{" "}
            {node.ref
              ? "disponível apenas para quem tem acesso ao caderno"
              : "não selecionado"}
          </span>
        </div>
      );
  }
}
