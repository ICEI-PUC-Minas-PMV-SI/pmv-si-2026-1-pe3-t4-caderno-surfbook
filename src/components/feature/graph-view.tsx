"use client";

import * as d3 from "d3";
import { Maximize2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { usePeek } from "@/components/feature/peek-provider";
import { Button } from "@/components/ui/button/button";
import {
  graphService,
  type GraphData,
  type GraphFilters,
  type GraphLink,
  type GraphNode,
} from "@/services/graph-service";
import { cn } from "@/lib/utils";

/**
 * Visualização do **grafo de conhecimento** — estilo Obsidian.
 *
 * Decisões de design:
 * - **D3 force simulation** com SVG. Eixo-1 já usava D3; reutilizamos a
 *   lógica de força (link/charge/collision/radial) e adaptamos pra React via
 *   ref + useEffect controlado por data hash.
 * - **Hover highlight (Obsidian-like):** mouse num nó → ele e seus vizinhos
 *   diretos ficam em opacity 1; resto vai pra 0.2. Reduz ruído visual.
 * - **Click → peek** (usePeek): integra com o sistema de peek do app —
 *   mesmo modelo do calendário.
 * - **Drag preserva posição** (fx/fy não nulos depois de soltar): comportamento
 *   esperado de "alfinetar" um nó.
 * - **Filtros laterais:** toggles por tipo + escopo opcional por caderno
 *   (passado via prop pelo `/cadernos/[id]/grafo` no futuro).
 *
 * Performance: SVG é OK pra ~500 nós. Acima disso, considerar canvas
 * (`react-force-graph-2d`). Por enquanto eixo-3 está bem.
 */

interface GraphViewProps {
  /** Quando definido, escopo o grafo a um caderno e suas tags. */
  notebookId?: string;
  /**
   * Posicionamento do painel de filtro/legenda:
   * - `overlay` (default) — flutua sobre o canto direito do canvas. Bom em
   *   /grafo e /cadernos/[id]/grafo (área grande).
   * - `below` — fica abaixo do canvas. Bom em embed estreito (ex.: sidebar
   *   do editor de nota), onde overlay cobriria a área útil.
   */
  panelPlacement?: "overlay" | "below";
  className?: string;
}

interface SimNode extends d3.SimulationNodeDatum, GraphNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

/** Cor base usada na legenda — match com o `TYPE_COLOR` interno do graph-service. */
const LEGEND_COLOR: Record<GraphNode["type"], string> = {
  notebook: "#6366f1",
  note: "#d97706",
  task: "#10b981",
  event: "#8b5cf6",
  tag: "#94a3b8",
};

/** Mini swatch SVG que replica o estilo real do nó: vazado pra entidades,
 *  preenchido pra tag, tracejado pra task. Inicial do tipo dentro. */
const INITIAL_FOR: Record<GraphNode["type"], string> = {
  notebook: "C",
  note: "N",
  task: "T",
  event: "E",
  tag: "#",
};

function LegendSwatch({ type }: { type: GraphNode["type"] }) {
  const color = LEGEND_COLOR[type];
  const fill = type === "tag" ? color : "transparent";
  const dash = type === "task" ? "2,1.5" : undefined;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill={fill}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={dash}
      />
      <text
        x="8"
        y="8"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fontWeight="700"
        fill={type === "tag" ? "white" : color}
      >
        {INITIAL_FOR[type]}
      </text>
    </svg>
  );
}

export function GraphView({
  notebookId,
  panelPlacement = "overlay",
  className,
}: GraphViewProps) {
  const peek = usePeek();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [data, setData] = useState<GraphData | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({
    showNotebooks: true,
    showNotes: true,
    showTasks: true,
    showEvents: true,
    showTags: true,
    colorMode: "type",
  });
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [queryInput, setQueryInput] = useState("");

  // Debounce: query no filters atualiza 250ms depois do último keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, query: queryInput.trim() || undefined }));
    }, 250);
    return () => clearTimeout(t);
  }, [queryInput]);

  // Carrega data + subscribe a mudanças
  useEffect(() => {
    let cancelled = false;
    function reload() {
      graphService
        .build({ ...filters, notebookId })
        .then((d) => {
          if (!cancelled) setData(d);
        });
    }
    reload();
    const off = graphService.subscribe(reload);
    return () => {
      cancelled = true;
      off();
    };
  }, [filters, notebookId]);

  // Renderiza/atualiza o grafo quando data muda
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", [-width / 2, -height / 2, width, height]);

    // Zoom layer
    const zoomLayer = svg.append("g");
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        zoomLayer.attr("transform", event.transform.toString());
        // Esconde labels em zoom muito baixo (Obsidian-like)
        const k = event.transform.k;
        zoomLayer
          .selectAll<SVGTextElement, SimNode>("text.node-label")
          .style("opacity", labelsVisible && k > 0.5 ? "" : "0");
      });
    svg.call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    // Convert to mutable sim nodes/links
    const simNodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = data.links.map((l) => ({ ...l }));

    // Mapa pra hover (vizinhos diretos)
    const adjacency = new Map<string, Set<string>>();
    for (const link of data.links) {
      if (!adjacency.has(link.source)) adjacency.set(link.source, new Set());
      if (!adjacency.has(link.target)) adjacency.set(link.target, new Set());
      adjacency.get(link.source)!.add(link.target);
      adjacency.get(link.target)!.add(link.source);
    }

    // Forces — combinação layered: tags na borda, cadernos no centro
    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(80)
          .strength(0.3)
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => {
          const node = d as SimNode;
          return -300 - Math.log2(node.weight + 1) * 80;
        })
      )
      .force(
        "collision",
        d3
          .forceCollide<SimNode>()
          .radius((d) => 12 + Math.log2(d.weight + 1) * 4)
          .strength(1)
      )
      .force(
        "radial",
        d3
          .forceRadial<SimNode>(
            (d) => {
              if (d.type === "notebook") return 60;
              if (d.type === "note" || d.type === "task" || d.type === "event")
                return 180;
              return 320; // tags
            },
            0,
            0
          )
          .strength(0.05)
      )
      .alphaDecay(0.025);
    simulationRef.current = simulation;

    // Links
    const linkSel = zoomLayer
      .append("g")
      .attr("class", "links")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.25)
      .selectAll<SVGLineElement, SimLink>("line")
      .data(simLinks)
      .join("line")
      .attr("stroke-width", 1);

    // Node groups
    const nodeSel = zoomLayer
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, SimNode>("g")
      .data(simNodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        // Click → peek
        if (d.type === "notebook") peek.openNotebookPeek(d.sourceId);
        else if (d.type === "note") peek.openNotePeek(d.sourceId);
        else if (d.type === "event") peek.openEventPeek(d.sourceId);
        else if (d.type === "task") peek.openTaskEdit(d.sourceId);
        // tag: TODO — futura tela /tags/[name]
      })
      .on("mouseover", function (_event, d) {
        const neighbors = adjacency.get(d.id) ?? new Set();
        nodeSel.style("opacity", (other) =>
          other.id === d.id || neighbors.has(other.id) ? 1 : 0.15
        );
        linkSel.style("opacity", (l) => {
          const sId = typeof l.source === "string" ? l.source : l.source.id;
          const tId = typeof l.target === "string" ? l.target : l.target.id;
          return sId === d.id || tId === d.id ? 0.8 : 0.05;
        });
      })
      .on("mouseout", () => {
        nodeSel.style("opacity", 1);
        linkSel.style("opacity", 0.25);
      })
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            // Não solta — mantém pinned (Obsidian style)
            d.fx = d.x;
            d.fy = d.y;
          })
      );

    // Círculos
    nodeSel
      .append("circle")
      .attr("r", (d) => 8 + Math.log2(d.weight + 1) * 3)
      .attr("fill", (d) => (d.type === "tag" ? d.color : "var(--color-surface)"))
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.type === "task" ? "3,2" : null));

    // Inicial do tipo dentro do círculo (C/N/T/E/#)
    const initialFor: Record<GraphNode["type"], string> = {
      notebook: "C",
      note: "N",
      task: "T",
      event: "E",
      tag: "#",
    };
    nodeSel
      .append("text")
      .attr("class", "node-initial")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "9px")
      .attr("font-weight", "700")
      .attr("fill", (d) => (d.type === "tag" ? "white" : d.color))
      .style("pointer-events", "none")
      .style("user-select", "none")
      .text((d) => initialFor[d.type]);

    // Labels
    nodeSel
      .append("text")
      .attr("class", "node-label")
      .attr("dy", (d) => -(12 + Math.log2(d.weight + 1) * 3))
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .style("opacity", labelsVisible ? "" : "0")
      .style("pointer-events", "none")
      .text((d) => d.label);

    // Tick handler
    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Toggle labels sem rerender da simulação
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    d3.select(svg)
      .selectAll<SVGTextElement, SimNode>("text.node-label")
      .style("opacity", labelsVisible ? "" : "0");
  }, [labelsVisible]);

  function resetView() {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
    // Solta todos os nós pinned
    if (simulationRef.current) {
      simulationRef.current.nodes().forEach((n) => {
        n.fx = null;
        n.fy = null;
      });
      simulationRef.current.alpha(0.5).restart();
    }
  }

  const stats = useMemo(() => {
    if (!data) return null;
    const counts: Record<GraphNode["type"], number> = {
      notebook: 0,
      note: 0,
      task: 0,
      event: 0,
      tag: 0,
    };
    for (const n of data.nodes) counts[n.type]++;
    return counts;
  }, [data]);

  const panel = (
    <div
      className={cn(
        "bg-surface space-y-3",
        panelPlacement === "overlay"
          ? "absolute right-4 top-4 w-64 rounded-lg border p-3 shadow-sm"
          : "border-t p-3"
      )}
    >
        <div>
          <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wide">
            Filtro rico
          </label>
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="#tag tipo:nota caderno:nome…"
            className="border-border bg-bg focus-visible:ring-brand-300 placeholder:text-muted-foreground/50 w-full rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-2"
            spellCheck={false}
          />
          {queryInput && (
            <button
              type="button"
              onClick={() => setQueryInput("")}
              className="text-muted-foreground hover:text-foreground mt-1 text-[10px] underline-offset-2 hover:underline"
            >
              Limpar filtro
            </button>
          )}
        </div>

        <div className="border-t pt-3">
          <h3 className="text-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            Legenda / tipos
          </h3>
          <ul className="space-y-1">
            {(
              [
                ["showNotebooks", "Cadernos", "notebook"],
                ["showNotes", "Notas", "note"],
                ["showTasks", "Tarefas", "task"],
                ["showEvents", "Eventos", "event"],
                ["showTags", "Tags", "tag"],
              ] as const
            ).map(([key, label, type]) => (
              <li key={key} className="flex items-center justify-between gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!filters[key]}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, [key]: e.target.checked }))
                    }
                    className="border-border accent-brand-500 size-3.5 rounded"
                  />
                  <LegendSwatch type={type} />
                  {label}
                </label>
                {stats && (
                  <span className="text-muted-foreground text-[10px] tabular-nums">
                    {stats[type]}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 text-[10px] leading-snug">
            Vazado = entidade · preenchido = tag · tracejado = tarefa.
            <br />
            Cor herda do caderno em notas, tarefas e eventos vinculados.
          </p>
        </div>

        <div className="border-t pt-3">
          <label className="text-muted-foreground mb-1 block text-[10px] font-medium uppercase tracking-wide">
            Cores
          </label>
          <div className="bg-muted/40 flex rounded p-0.5">
            {(["type", "notebook"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  setFilters((f) => ({ ...f, colorMode: mode }))
                }
                className={cn(
                  "flex-1 rounded px-2 py-1 text-xs transition-colors",
                  filters.colorMode === mode
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "type" ? "Por tipo" : "Por caderno"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLabelsVisible((v) => !v)}
            className="flex-1"
            title="Mostrar/ocultar nomes"
          >
            {labelsVisible ? "Ocultar" : "Mostrar"} nomes
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            className="flex-1"
            title="Resetar zoom e desafixar nós"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (svgRef.current) svgRef.current.requestFullscreen?.();
            }}
            className="size-8 p-0"
            aria-label="Tela cheia"
          >
            <Maximize2 className="size-3.5" aria-hidden />
          </Button>
        </div>

        <p className="text-muted-foreground border-t pt-2 text-[10px] leading-relaxed">
          Hover destaca vizinhos. Click abre peek. Arraste pra fixar nós.
        </p>
    </div>
  );

  if (panelPlacement === "below") {
    return (
      <div
        ref={containerRef}
        className={cn("bg-surface flex size-full flex-col", className)}
      >
        <div className="relative min-h-[12rem] flex-1">
          <svg
            ref={svgRef}
            className="text-foreground bg-bg/30 absolute inset-0 size-full"
            role="img"
            aria-label="Grafo de conhecimento"
          />
        </div>
        {panel}
      </div>
    );
  }

  return (
    <div className={cn("relative size-full", className)} ref={containerRef}>
      <svg
        ref={svgRef}
        className="text-foreground bg-bg/30 size-full"
        role="img"
        aria-label="Grafo de conhecimento"
      />
      {panel}
    </div>
  );
}
