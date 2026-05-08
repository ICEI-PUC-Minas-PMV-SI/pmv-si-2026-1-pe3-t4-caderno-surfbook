import type {
  NoteNode,
  NoteNodeDraft,
} from "@/types/note-node";

/**
 * Conversores Markdown ↔ NoteNode[].
 *
 * - `markdownToNodes`: parse line-based para colar/importar conteúdo de
 *   qualquer fonte Markdown (Notion export, gist, etc.) e ter blocos
 *   prontos pra editar.
 * - `nodesToMarkdown`: serialização inversa pra exportar/copiar (botão
 *   "Exportar como Markdown" no editor).
 *
 * Não pretende ser um parser de MD completo (ignora ênfase inline como
 * **bold** / *italic* dentro do texto — preserva como literal).
 */

export function markdownToNodes(md: string): NoteNode[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const drafts: NoteNodeDraft[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading (# / ## / ###)
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      drafts.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      i++;
      continue;
    }

    // Image alone on the line: ![alt](url)
    const image = line.match(/^!\[(.*?)\]\((.+?)\)\s*$/);
    if (image) {
      drafts.push({
        type: "image",
        alt: image[1] || undefined,
        url: image[2],
      });
      i++;
      continue;
    }

    // Divider: --- / *** / ___
    if (/^(\-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      drafts.push({ type: "divider" });
      i++;
      continue;
    }

    // Code fence: ```lang
    const codeFence = line.match(/^```\s*(\S*)\s*$/);
    if (codeFence) {
      const language = codeFence[1] || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing ```
      drafts.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    // Quote: > line, > line
    if (line.startsWith("> ") || line === ">") {
      const quoteLines: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("> ") || lines[i] === ">")
      ) {
        quoteLines.push(lines[i] === ">" ? "" : lines[i].slice(2));
        i++;
      }
      drafts.push({ type: "quote", text: quoteLines.join("\n").trim() });
      continue;
    }

    // Checklist (must check before plain list)
    // Captura indent (espaços iniciais), marcador, [ ]/[x], e texto
    const checkUnordered = line.match(/^( *)[-*]\s+\[([ xX])\]\s+(.+)$/);
    const checkOrdered = line.match(/^( *)\d+\.\s+\[([ xX])\]\s+(.+)$/);
    if (checkUnordered || checkOrdered) {
      const ordered = !!checkOrdered;
      const items: {
        id: string;
        checked: boolean;
        text: string;
        indent: number;
      }[] = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^( *)\d+\.\s+\[([ xX])\]\s+(.+)$/)
          : lines[i].match(/^( *)[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (!m) break;
        items.push({
          id: crypto.randomUUID(),
          checked: m[2].toLowerCase() === "x",
          text: m[3].trim(),
          indent: Math.floor(m[1].length / 2),
        });
        i++;
      }
      drafts.push({ type: "checklist", ordered, items });
      continue;
    }

    // Plain list (unordered/ordered)
    const unorderedItem = line.match(/^( *)[-*]\s+(.+)$/);
    const orderedItem = line.match(/^( *)\d+\.\s+(.+)$/);
    if (unorderedItem || orderedItem) {
      const ordered = !!orderedItem;
      const items: { text: string; indent: number }[] = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^( *)\d+\.\s+(.+)$/)
          : lines[i].match(/^( *)[-*]\s+(.+)$/);
        if (!m) break;
        // Skip se for checklist na verdade
        if (/^\[[\sxX]\]/.test(m[2])) break;
        items.push({
          text: m[2].trim(),
          indent: Math.floor(m[1].length / 2),
        });
        i++;
      }
      drafts.push({ type: "list", ordered, items });
      continue;
    }

    // Paragraph — agrupa linhas consecutivas até linha vazia ou bloco especial
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^!\[.*\]\(.+\)\s*$/.test(lines[i]) &&
      !lines[i].startsWith("> ") &&
      lines[i] !== ">" &&
      !/^```/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^(\-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      drafts.push({
        type: "paragraph",
        text: paragraphLines.join(" ").trim(),
      });
    } else {
      i++; // safety: nunca trava
    }
  }

  // Materializa com id + position
  return drafts.map((d, idx) => ({
    ...d,
    id: crypto.randomUUID(),
    position: idx,
  })) as NoteNode[];
}

export function nodesToMarkdown(nodes: NoteNode[]): string {
  return [...nodes]
    .sort((a, b) => a.position - b.position)
    .map((node) => {
      switch (node.type) {
        case "heading":
          return `${"#".repeat(node.level)} ${node.text}`;

        case "paragraph":
          return node.text;

        case "list":
          return node.items
            .map((item, i) => {
              const pad = "  ".repeat(item.indent ?? 0);
              return node.ordered
                ? `${pad}${i + 1}. ${item.text}`
                : `${pad}- ${item.text}`;
            })
            .join("\n");

        case "checklist":
          return node.items
            .map((item, i) => {
              const pad = "  ".repeat(item.indent ?? 0);
              const box = item.checked ? "[x]" : "[ ]";
              return node.ordered
                ? `${pad}${i + 1}. ${box} ${item.text}`
                : `${pad}- ${box} ${item.text}`;
            })
            .join("\n");

        case "image":
          return `![${node.alt ?? ""}](${node.url})`;

        case "quote":
          return node.text
            .split("\n")
            .map((l) => (l ? `> ${l}` : ">"))
            .join("\n");

        case "code":
          return `\`\`\`${node.language ?? ""}\n${node.code}\n\`\`\``;

        case "divider":
          return "---";
      }
    })
    .join("\n\n");
}

/**
 * Snippet curto pra preview de listagem (sem renderizar o nó inteiro).
 * Concatena texto dos primeiros nodes textuais até atingir `max` chars.
 */
export function nodesToSnippet(nodes: NoteNode[], max = 140): string {
  const parts: string[] = [];
  for (const n of [...nodes].sort((a, b) => a.position - b.position)) {
    let chunk = "";
    switch (n.type) {
      case "heading":
      case "paragraph":
      case "quote":
        chunk = n.text;
        break;
      case "list":
        chunk = n.items.map((i) => i.text).join(" · ");
        break;
      case "checklist":
        chunk = n.items.map((i) => i.text).join(" · ");
        break;
      case "code":
        chunk = n.code.split("\n")[0] ?? "";
        break;
      case "image":
        chunk = `🖼 ${n.alt ?? "imagem"}`;
        break;
      case "divider":
        continue;
    }
    if (!chunk) continue;
    parts.push(chunk);
    if (parts.join(" ").length >= max) break;
  }
  const joined = parts.join(" ").replace(/\s+/g, " ").trim();
  return joined.length > max ? joined.slice(0, max - 1) + "…" : joined;
}
