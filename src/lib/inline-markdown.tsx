import { Link2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

/**
 * Parser inline para Markdown — `**negrito**`, `*itálico*`, `__sublinhado__`,
 * `` `código` ``, `~~strike~~`, e links `[texto](url)` (incluindo o esquema
 * interno `surfbook://`).
 *
 * Usado no `NoteNodeRenderer` (visualização) para que texto digitado pelo
 * usuário com markers seja renderizado formatado.
 *
 * Nesting raso é suportado (ex.: `**bold *italic***`) via recursão.
 *
 * Convenção:
 * - `**...**` → negrito
 * - `__...__` → sublinhado (extensão; padrão MD usaria `<u>`)
 * - `*...*` → itálico
 * - `_..._` → itálico (alias)
 * - `` `...` `` → código inline
 * - `~~...~~` → tachado
 * - `[texto](url)` → link (externo) ou link interno se url começa com `surfbook://`
 */

interface Pattern {
  regex: RegExp;
  wrap: (m: RegExpExecArray, key: string) => React.ReactNode;
}

/** Converte caminho `surfbook://kind/...` na rota Next correspondente. */
export function surfbookPathToHref(path: string): string {
  const parts = path.split("/").filter(Boolean);
  switch (parts[0]) {
    case "notebook":
      return parts[1] ? `/cadernos/${parts[1]}/notas` : "/";
    case "note":
      return parts[1] && parts[2]
        ? `/cadernos/${parts[1]}/notas/${parts[2]}`
        : "/";
    case "node":
      return parts[1] && parts[2] && parts[3]
        ? `/cadernos/${parts[1]}/notas/${parts[2]}#node-${parts[3]}`
        : "/";
    default:
      return "/";
  }
}

// Ordem importa: markers de 2 caracteres vêm antes dos de 1 pra evitar
// que `**bold**` seja interpretado como dois `*italic*` consecutivos.
const PATTERNS: Pattern[] = [
  // Link `[texto](url)` — antes dos markers de ênfase pra capturar o `[`/`]`
  {
    regex: /\[([^\]]+)\]\(([^)]+)\)/,
    wrap: (m, k) => {
      const [, label, url] = m;
      if (url.startsWith("surfbook://")) {
        const path = url.slice("surfbook://".length);
        return (
          <Link
            key={k}
            href={surfbookPathToHref(path)}
            className="text-brand-500 hover:text-brand-700 underline-offset-2 hover:underline"
          >
            <Link2 className="mr-0.5 inline size-3 align-baseline" aria-hidden />
            {label}
          </Link>
        );
      }
      return (
        <a
          key={k}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 hover:text-brand-700 underline-offset-2 hover:underline"
        >
          {label}
        </a>
      );
    },
  },
  {
    regex: /\*\*(.+?)\*\*/,
    wrap: (m, k) => <strong key={k}>{parseInline(m[1])}</strong>,
  },
  {
    regex: /__(.+?)__/,
    wrap: (m, k) => <u key={k}>{parseInline(m[1])}</u>,
  },
  {
    regex: /~~(.+?)~~/,
    wrap: (m, k) => <del key={k}>{parseInline(m[1])}</del>,
  },
  {
    regex: /`(.+?)`/,
    wrap: (m, k) => (
      <code
        key={k}
        className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[0.9em]"
      >
        {m[1]}
      </code>
    ),
  },
  {
    regex: /\*(.+?)\*/,
    wrap: (m, k) => <em key={k}>{parseInline(m[1])}</em>,
  },
  {
    regex: /(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/,
    wrap: (m, k) => <em key={k}>{parseInline(m[1])}</em>,
  },
];

export function parseInline(text: string): React.ReactNode {
  if (!text) return text;

  const result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliest = -1;
    let chosenPattern: Pattern | null = null;
    let chosenMatch: RegExpExecArray | null = null;

    for (const p of PATTERNS) {
      const m = p.regex.exec(remaining);
      if (m && (earliest === -1 || m.index < earliest)) {
        earliest = m.index;
        chosenPattern = p;
        chosenMatch = m;
      }
    }

    if (!chosenPattern || !chosenMatch || earliest === -1) {
      result.push(remaining);
      break;
    }

    if (earliest > 0) {
      result.push(remaining.slice(0, earliest));
    }

    result.push(chosenPattern.wrap(chosenMatch, `inline-${key++}`));
    remaining = remaining.slice(earliest + chosenMatch[0].length);
  }

  return result.length === 1 ? result[0] : result;
}
