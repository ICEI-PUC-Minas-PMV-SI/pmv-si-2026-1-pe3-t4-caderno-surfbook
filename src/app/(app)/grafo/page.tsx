"use client";

import { GraphView } from "@/components/feature/graph-view";

export default function GraphPage() {
  return (
    <div className="-mx-8 -my-8 flex h-[calc(100vh-4rem)] flex-col">
      <header className="border-b px-8 py-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Grafo de conhecimento
        </h1>
        <p className="text-muted-foreground text-sm">
          Como suas entidades se conectam — pelas tags compartilhadas e pelas
          referências internas.
        </p>
      </header>
      <div className="flex-1">
        <GraphView />
      </div>
    </div>
  );
}
