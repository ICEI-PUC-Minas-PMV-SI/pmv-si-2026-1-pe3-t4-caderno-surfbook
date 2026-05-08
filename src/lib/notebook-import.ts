import JSZip from "jszip";

import { markdownToNodes } from "@/lib/markdown-nodes";
import { colorForTagName } from "@/components/ui/tag-selector/tag-selector";
import { noteService } from "@/services/note-service";
import { notebookService, type Notebook } from "@/services/notebook-service";
import type { NoteNode } from "@/types/note-node";
import type { Tag } from "@/types/tag";

/**
 * Import inverso ao `notebook-export.ts` — lê um `.zip` produzido pelo SurfBook
 * (ou qualquer .zip com `index.md` + `notes/*.md` em formato compatível) e
 * cria um caderno + notas no usuário corrente.
 *
 * **Resilência:** o formato esperado é o que o export gera, mas o import tenta
 * lidar com:
 * - Falta de `index.md` → usa nome do .zip ou primeiro título encontrado
 * - Front-matter ausente → infere título do primeiro `# H1`
 * - Notas em qualquer pasta (não só `notes/`)
 * - Formatos de tag (lista YAML ou ausente)
 *
 * **Round-trip:** export → import → mesmo caderno (com novos UUIDs).
 *
 * **Reescrita reversa:** links `./outra-nota.md` viram `surfbook://note/<novoNbId>/<novoNoteId>`.
 */

interface ParsedFrontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  iconName?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  notebook?: string;
}

interface ParsedDoc {
  /** Caminho original dentro do zip (ex.: "notes/01-foo.md"). */
  path: string;
  /** Slug derivado do filename sem extensão. */
  slug: string;
  frontmatter: ParsedFrontmatter;
  /** Body Markdown sem front-matter, mas sem trim do H1 inicial. */
  body: string;
}

/**
 * Mini parser de YAML — entende só o subset que o export gera:
 * - `key: value` (string single-line)
 * - `key:` seguido de `  - item` (array)
 * - Strings com aspas duplas escapadas `"..."`
 *
 * Não tenta ser geral — deliberadamente limitado.
 */
function parseFrontmatter(yaml: string): ParsedFrontmatter {
  const fm: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    const rest = m[2].trim();
    if (rest === "") {
      // Possível array
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemMatch = lines[j].match(/^\s*-\s+(.*)$/);
        if (!itemMatch) break;
        items.push(unquoteString(itemMatch[1].trim()));
        j++;
      }
      if (items.length > 0) {
        fm[key] = items;
        i = j;
        continue;
      }
      // Vazio mesmo
      fm[key] = "";
      i++;
      continue;
    }
    fm[key] = unquoteString(rest);
    i++;
  }
  // Normaliza para shape esperado
  const result: ParsedFrontmatter = {};
  if (typeof fm.title === "string") result.title = fm.title;
  if (typeof fm.description === "string") result.description = fm.description;
  if (typeof fm.iconName === "string") result.iconName = fm.iconName;
  if (typeof fm.dueDate === "string" && fm.dueDate) result.dueDate = fm.dueDate;
  if (typeof fm.completedAt === "string" && fm.completedAt)
    result.completedAt = fm.completedAt;
  if (typeof fm.createdAt === "string") result.createdAt = fm.createdAt;
  if (typeof fm.updatedAt === "string") result.updatedAt = fm.updatedAt;
  if (typeof fm.notebook === "string") result.notebook = fm.notebook;
  if (Array.isArray(fm.tags)) {
    result.tags = fm.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return result;
}

function unquoteString(s: string): string {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"');
  }
  return s;
}

function splitFrontmatter(content: string): {
  frontmatter: ParsedFrontmatter;
  body: string;
} {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return { frontmatter: {}, body: content };
  }
  const rest = content.slice(content.indexOf("\n") + 1);
  const endIdx = rest.indexOf("\n---");
  if (endIdx === -1) {
    return { frontmatter: {}, body: content };
  }
  const yaml = rest.slice(0, endIdx);
  // Pula o "---" + newline subsequente
  const afterFence = rest.slice(endIdx + 4); // "\n---" → 4 chars
  const body = afterFence.startsWith("\n")
    ? afterFence.slice(1)
    : afterFence.startsWith("\r\n")
      ? afterFence.slice(2)
      : afterFence;
  return { frontmatter: parseFrontmatter(yaml), body };
}

function pathSlug(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.md$/i, "");
}

function inferTitle(frontmatter: ParsedFrontmatter, body: string): string {
  if (frontmatter.title) return frontmatter.title;
  // Procura primeiro H1 no body
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return "Sem título";
}

/**
 * Reescreve referências relativas pra surfbook:// usando o mapa slug → noteId.
 * - `./<slug>.md` → `surfbook://note/<nbId>/<noteId>`
 * - `./<slug>.md#node-<id>` → `surfbook://node/<nbId>/<noteId>/<id>`
 * - `../index.md` → `surfbook://notebook/<nbId>`
 */
function rewriteToInternal(
  body: string,
  notebookId: string,
  slugToNoteId: Map<string, string>
): string {
  // Trata links em formato [label](path)
  return body.replace(
    /\[([^\]]+)\]\((\.\/[^)]+|\.\.\/index\.md)\)/g,
    (match, label: string, target: string) => {
      if (target === "../index.md") {
        return `[${label}](surfbook://notebook/${notebookId})`;
      }
      // ./<slug>.md ou ./<slug>.md#node-<id>
      const m = target.match(/^\.\/([^#]+?)\.md(?:#node-([^)]+))?$/);
      if (!m) return match;
      const slug = m[1];
      const anchor = m[2];
      const noteId = slugToNoteId.get(slug);
      if (!noteId) return match;
      if (anchor) {
        return `[${label}](surfbook://node/${notebookId}/${noteId}/${anchor})`;
      }
      return `[${label}](surfbook://note/${notebookId}/${noteId})`;
    }
  );
}

/**
 * Strip do primeiro H1 do body (o export coloca um após o front-matter, mas o
 * título já vai no campo `title` da nota — duplicaria).
 */
function stripLeadingH1(body: string): string {
  return body.replace(/^#\s+.+\n+/, "");
}

/**
 * Constrói tags com cor determinística pelo nome (preserva consistência
 * cross-import: mesma tag → mesma cor).
 */
function tagsFromNames(names: string[] | undefined): Tag[] {
  if (!names || names.length === 0) return [];
  return names.map((name) => ({
    id: crypto.randomUUID(),
    name,
    color: colorForTagName(name),
  }));
}

export interface ImportResult {
  notebook: Notebook;
  noteCount: number;
}

/**
 * Lê um File (do <input type="file">), processa e cria o caderno + notas.
 * Retorna metadata pra o caller mostrar feedback.
 */
export async function importNotebookFromZip(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file);

  // 1. Coleta todos os .md do zip
  const docs: ParsedDoc[] = [];
  let indexDoc: ParsedDoc | null = null;
  const entries = Object.values(zip.files).filter(
    (f) => !f.dir && f.name.toLowerCase().endsWith(".md")
  );
  for (const entry of entries) {
    const content = await entry.async("string");
    const { frontmatter, body } = splitFrontmatter(content);
    const doc: ParsedDoc = {
      path: entry.name,
      slug: pathSlug(entry.name),
      frontmatter,
      body,
    };
    if (entry.name === "index.md" || entry.name.endsWith("/index.md")) {
      indexDoc = doc;
    } else if (doc.slug.toLowerCase() === "readme") {
      // Ignora README — é doc do próprio zip
      continue;
    } else {
      docs.push(doc);
    }
  }

  if (docs.length === 0 && !indexDoc) {
    throw new Error("ZIP sem arquivos .md reconhecíveis.");
  }

  // 2. Determina nome do caderno
  const fallbackName = file.name.replace(/\.zip$/i, "") || "Caderno importado";
  const notebookName =
    indexDoc?.frontmatter.title || fallbackName;
  const notebookDescription = indexDoc?.frontmatter.description ?? "";

  // 3. Cria o caderno
  const notebook = await notebookService.create({
    name: notebookName,
    description: notebookDescription,
    iconName: indexDoc?.frontmatter.iconName,
    tags: tagsFromNames(indexDoc?.frontmatter.tags),
    dueDate: indexDoc?.frontmatter.dueDate,
  });

  // 4. Mapa slug → noteId, criando notas vazias primeiro pra resolver refs
  const slugToNoteId = new Map<string, string>();
  const created: { doc: ParsedDoc; noteId: string }[] = [];
  for (const doc of docs) {
    const note = await noteService.create({
      notebookId: notebook.id,
      title: inferTitle(doc.frontmatter, doc.body),
      // nodes vazios por enquanto — segundo pass faz o conteúdo
      nodes: [],
      tags: tagsFromNames(doc.frontmatter.tags),
      dueDate: doc.frontmatter.dueDate,
    });
    slugToNoteId.set(doc.slug, note.id);
    created.push({ doc, noteId: note.id });
  }

  // 5. Pass 2: reescreve links + parseia markdown + atualiza nota
  for (const { doc, noteId } of created) {
    const stripped = stripLeadingH1(doc.body);
    const rewritten = rewriteToInternal(stripped, notebook.id, slugToNoteId);
    const nodes: NoteNode[] = markdownToNodes(rewritten);
    await noteService.update(noteId, {
      nodes,
      completedAt: doc.frontmatter.completedAt ?? null,
    });
  }

  return { notebook, noteCount: created.length };
}
