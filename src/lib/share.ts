import type { Note } from "@/services/note-service";
import type { Notebook } from "@/services/notebook-service";

/**
 * Compartilhamento de notas via URL — porta do `share-engine.js` do eixo-1.
 *
 * Toda a nota (mais o contexto do caderno) é serializada em JSON, codificada
 * em base64 URL-safe e embutida no link. Não envolve backend: o destinatário
 * decodifica no client.
 *
 * Trade-offs:
 * - URLs longas (alguns KB) — aceitável, é uma prova de conceito
 * - Não permite revogar acesso após compartilhar (pra isso precisaria de
 *   storage compartilhado / backend real)
 * - Conteúdo é público pra quem tiver o link
 */

const SHARE_VERSION = 1;

export interface SharePayload {
  v: number;
  notebook: {
    name: string;
    description: string;
    iconName?: string;
    coverUrl?: string;
  };
  note: {
    title: string;
    nodes: Note["nodes"];
    tags: Note["tags"];
    createdAt: string;
    updatedAt: string;
  };
  sharedAt: string;
}

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(b64: string): string {
  let padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  while (padded.length % 4 !== 0) padded += "=";
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShare(notebook: Notebook, note: Note): string {
  const payload: SharePayload = {
    v: SHARE_VERSION,
    notebook: {
      name: notebook.name,
      description: notebook.description,
      iconName: notebook.iconName,
      coverUrl: notebook.coverUrl,
    },
    note: {
      title: note.title,
      nodes: note.nodes,
      tags: note.tags,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    },
    sharedAt: new Date().toISOString(),
  };
  return encodeBase64Url(JSON.stringify(payload));
}

export function decodeShare(shareId: string): SharePayload | null {
  try {
    const json = decodeBase64Url(shareId);
    const parsed = JSON.parse(json) as SharePayload;
    if (parsed.v !== SHARE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildShareUrl(notebook: Notebook, note: Note): string {
  const id = encodeShare(notebook, note);
  if (typeof window === "undefined") return `/compartilhado/${id}`;
  return `${window.location.origin}/compartilhado/${id}`;
}
