import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { NoteNodeRenderer } from "@/components/feature/note-node-renderer";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import { EmptyState } from "@/components/ui/empty-state/empty-state";
import { getIconComponent } from "@/lib/icons";
import { decodeShare } from "@/lib/share";

export const metadata = {
  title: "Nota compartilhada · SurfBook",
};

export default async function SharedNotePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const payload = decodeShare(shareId);

  if (!payload) {
    return (
      <div className="bg-bg flex min-h-screen flex-col">
        <header className="bg-surface border-b">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span className="font-display text-lg font-semibold">
              <span className="text-brand-500 font-normal">Surf</span>
              <span className="text-brand-700">Book.</span>
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-12">
          <EmptyState
            title="Link inválido ou expirado"
            description="O link compartilhado não pôde ser decodificado. Confira se ele foi copiado por inteiro."
            action={
              <Button asChild>
                <Link href="/">Voltar para o SurfBook</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  const Icon = getIconComponent(payload.notebook.iconName);
  const sortedNodes = [...payload.note.nodes].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      <header className="bg-surface border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={28} height={28} />
            <span className="font-display text-lg font-semibold">
              <span className="text-brand-500 font-normal">Surf</span>
              <span className="text-brand-700">Book.</span>
            </span>
          </Link>
          <Button asChild size="sm" variant="secondary">
            <Link href="/cadastrar">
              Criar conta
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      <div className="bg-brand-50 border-brand-200 border-b">
        <div className="text-brand-700 mx-auto flex max-w-3xl items-center gap-2 px-6 py-2 text-xs">
          <BookOpen className="size-3.5" aria-hidden />
          Você está vendo uma nota compartilhada — somente leitura.
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {payload.notebook.coverUrl && (
          <div className="bg-muted mb-6 h-40 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payload.notebook.coverUrl}
              alt={`Capa do caderno ${payload.notebook.name}`}
              className="size-full object-cover"
            />
          </div>
        )}

        <div className="mb-2 flex items-center gap-2 text-sm">
          {Icon && (
            <div className="bg-brand-100 text-brand-700 flex size-7 items-center justify-center rounded">
              <Icon className="size-3.5" aria-hidden />
            </div>
          )}
          <span className="text-muted-foreground">
            {payload.notebook.name}
          </span>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {payload.note.title || "Sem título"}
        </h1>

        {payload.note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {payload.note.tags.map((tag) => (
              <Badge key={tag.id} color={tag.color}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {sortedNodes.map((node) => (
            <NoteNodeRenderer key={node.id} node={node} />
          ))}
        </div>

        <footer className="text-muted-foreground mt-12 border-t pt-6 text-xs">
          Compartilhada via SurfBook em{" "}
          {new Date(payload.sharedAt).toLocaleString("pt-BR")}
        </footer>
      </main>
    </div>
  );
}
