import JSZip from "jszip";

import { nodesToMarkdown } from "@/lib/markdown-nodes";
import type { Note } from "@/services/note-service";
import type { Notebook } from "@/services/notebook-service";

/**
 * Exporta um caderno inteiro pra um `.zip` compatível com Markdown padrão.
 *
 * Estrutura:
 * ```
 * <slug-do-caderno>.zip
 * ├── README.md      ← origem + instruções
 * ├── index.md       ← metadata do caderno + TOC linkando pras notas
 * └── notes/
 *     ├── 01-titulo-da-nota.md
 *     ├── 02-outra-nota.md
 *     └── …
 * ```
 *
 * Reescrita de links: `surfbook://...` é interno do app — em export, vira:
 * - mesma-caderno/note → `./<slug>.md` (relativo dentro de `notes/`)
 * - mesma-caderno/node → `./<slug>.md#node-<id>` (âncora — gerada pelo
 *   título do bloco quando texto, ou pelo id senão)
 * - notebook próprio → `../index.md`
 * - cross-caderno (referência a outro caderno/nota fora do exportado) →
 *   mantém o label como texto puro (link removido) com nota inline
 *
 * Front-matter YAML em cada nota: title, tags, dueDate, completedAt, datas.
 *
 * Trade-off conhecido: imagens (URLs externas) não são baixadas — ficam como
 * URLs no markdown. Sem backend, baixar imagens passaria por CORS/proxy.
 */

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // remove diacríticos
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "sem-titulo"
  );
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  let i = 2;
  while (taken.has(slug)) {
    slug = `${base}-${i++}`;
  }
  taken.add(slug);
  return slug;
}

function yamlValue(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") {
    // string com aspas se tiver caractere especial
    if (/[:#\n]/.test(v)) return `"${v.replace(/"/g, '\\"')}"`;
    return v;
  }
  return String(v);
}

function buildFrontmatter(
  title: string,
  fields: Record<string, unknown>
): string {
  const lines: string[] = ["---"];
  lines.push(`title: ${yamlValue(title)}`);
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${yamlValue(item)}`);
      }
    } else {
      lines.push(`${key}: ${yamlValue(value)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Reescreve links `surfbook://...` no body de uma nota em markdown plain.
 * Recebe maps de resolução pra rotear corretamente.
 */
function rewriteInternalLinks(
  markdown: string,
  scopedNotebookId: string,
  noteSlugById: Map<string, string>
): string {
  // [label](surfbook://kind/...)
  return markdown.replace(
    /\[([^\]]+)\]\(surfbook:\/\/([^)]+)\)/g,
    (match, label: string, path: string) => {
      const parts = path.split("/").filter(Boolean);
      const kind = parts[0];
      if (kind === "notebook") {
        const targetNbId = parts[1];
        if (targetNbId === scopedNotebookId) {
          return `[${label}](../index.md)`;
        }
        // Caderno externo — drop link
        return `${label} _(caderno externo)_`;
      }
      if (kind === "note" || kind === "node") {
        const targetNbId = parts[1];
        const targetNoteId = parts[2];
        const anchorId = parts[3];
        if (targetNbId !== scopedNotebookId) {
          return `${label} _(nota externa)_`;
        }
        const slug = noteSlugById.get(targetNoteId);
        if (!slug) return `${label} _(nota não encontrada)_`;
        const anchor = anchorId ? `#node-${anchorId}` : "";
        return `[${label}](./${slug}.md${anchor})`;
      }
      return match;
    }
  );
}

function noteToMarkdownDoc(
  note: Note,
  notebook: Notebook,
  noteSlugById: Map<string, string>
): string {
  const fm = buildFrontmatter(note.title || "Sem título", {
    tags: note.tags?.map((t) => t.name),
    dueDate: note.dueDate,
    completedAt: note.completedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    notebook: notebook.name,
  });
  const body = nodesToMarkdown(note.nodes ?? []);
  const rewritten = rewriteInternalLinks(body, notebook.id, noteSlugById);
  return `${fm}# ${note.title || "Sem título"}\n\n${rewritten}\n`;
}

function indexMarkdown(
  notebook: Notebook,
  notes: { slug: string; title: string }[]
): string {
  const fm = buildFrontmatter(notebook.name, {
    description: notebook.description,
    tags: notebook.tags?.map((t) => t.name),
    iconName: notebook.iconName,
    dueDate: notebook.dueDate,
    completedAt: notebook.completedAt,
    createdAt: notebook.createdAt,
    updatedAt: notebook.updatedAt,
  });
  const lines: string[] = [
    fm,
    `# ${notebook.name}`,
    "",
  ];
  if (notebook.description) {
    lines.push(notebook.description, "");
  }
  if (notes.length === 0) {
    lines.push("_Caderno sem notas._");
  } else {
    lines.push("## Notas", "");
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      lines.push(`${i + 1}. [${n.title}](./notes/${n.slug}.md)`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

const README = `# Caderno exportado do SurfBook

Este é um snapshot do seu caderno em formato Markdown padrão. Você pode:

- Abrir em qualquer editor de Markdown (Obsidian, VSCode, Typora, etc.)
- Versionar em git
- Hospedar em qualquer plataforma estática (GitHub Pages, Netlify, etc.)

## Estrutura

- \`index.md\` — metadata do caderno + sumário de notas
- \`notes/\` — uma .md por nota, com YAML front-matter (tags, datas, etc.)

## Links internos

Referências entre notas do mesmo caderno foram convertidas em links
relativos (\`./notes/<slug>.md\`). Referências a cadernos/notas **fora** do
caderno exportado foram preservadas como texto (sem link), com nota
indicando "caderno externo" / "nota externa".

## Imagens

Imagens são URLs externas no markdown — não foram baixadas pra dentro do
.zip. Se quiser auto-contidas, baixe-as manualmente e atualize os links.

---

Gerado em ${new Date().toISOString()} por SurfBook.
`;

/**
 * Gera o blob do .zip com todo o conteúdo do caderno + notas.
 */
export async function buildNotebookZip(
  notebook: Notebook,
  notes: Note[]
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Slugs únicos por nota, ordenados por position
  const sorted = [...notes].sort((a, b) => a.position - b.position);
  const taken = new Set<string>();
  const noteEntries: { note: Note; slug: string }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i];
    const baseSlug = slugify(note.title);
    const numbered = `${String(i + 1).padStart(2, "0")}-${baseSlug}`;
    const slug = uniqueSlug(numbered, taken);
    noteEntries.push({ note, slug });
  }
  const noteSlugById = new Map(
    noteEntries.map((e) => [e.note.id, e.slug])
  );

  // 2. README na raiz
  zip.file("README.md", README);

  // 3. index.md na raiz
  zip.file(
    "index.md",
    indexMarkdown(
      notebook,
      noteEntries.map((e) => ({
        slug: e.slug,
        title: e.note.title || "Sem título",
      }))
    )
  );

  // 4. notes/<slug>.md por nota
  for (const { note, slug } of noteEntries) {
    zip.file(
      `notes/${slug}.md`,
      noteToMarkdownDoc(note, notebook, noteSlugById)
    );
  }

  return zip.generateAsync({ type: "blob" });
}

/**
 * Helper de UI — gera o ZIP e dispara download no browser.
 */
export async function downloadNotebookZip(
  notebook: Notebook,
  notes: Note[]
): Promise<void> {
  const blob = await buildNotebookZip(notebook, notes);
  const filename = `${slugify(notebook.name)}.zip`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Liberar URL depois — Chrome às vezes precisa de um respiro
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
