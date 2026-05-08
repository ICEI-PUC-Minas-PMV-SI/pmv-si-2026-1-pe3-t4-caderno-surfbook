import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta = {
  title: "Design System/Tokens",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Tokens centralizam decisões visuais do design system. Cada decisão é justificada pelos princípios do microfundamento (Gestalt, lentes cognitiva/semiótica, 8 regras de ouro de Shneiderman).",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const brandSwatches = [
  { name: "brand-50",  className: "bg-brand-50" },
  { name: "brand-100", className: "bg-brand-100" },
  { name: "brand-200", className: "bg-brand-200" },
  { name: "brand-300", className: "bg-brand-300" },
  { name: "brand-400", className: "bg-brand-400" },
  { name: "brand-500", className: "bg-brand-500" },
  { name: "brand-600", className: "bg-brand-600" },
  { name: "brand-700", className: "bg-brand-700" },
  { name: "brand-800", className: "bg-brand-800" },
  { name: "brand-900", className: "bg-brand-900" },
];

const neutralSwatches = [
  { name: "bg",         className: "bg-bg" },
  { name: "surface",    className: "bg-surface" },
  { name: "muted",      className: "bg-muted" },
  { name: "border",     className: "bg-border" },
  { name: "foreground", className: "bg-foreground" },
];

const semanticSwatches = [
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger",  className: "bg-danger" },
];

const radii = [
  { name: "sm",      className: "rounded-sm" },
  { name: "DEFAULT", className: "rounded" },
  { name: "lg",      className: "rounded-lg" },
  { name: "xl",      className: "rounded-xl" },
];

export const Paleta: Story = {
  render: () => (
    <section className="space-y-6 p-8">
      <header>
        <h2 className="font-display text-2xl font-semibold">Paleta Brand</h2>
        <p className="text-muted-foreground text-sm">
          Mantém a cor azul do logo do eixo-1 (≈ <code>#145AF1</code> em{" "}
          <code>brand-500</code>). Definida em escala 50–900 para apoiar
          hierarquia visual (Gestalt: figura-fundo).
        </p>
      </header>
      <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
        {brandSwatches.map((t) => (
          <div key={t.name} className="space-y-1">
            <div
              className={`h-16 rounded-lg border ${t.className}`}
              aria-label={t.name}
            />
            <div className="font-mono text-xs">{t.name}</div>
          </div>
        ))}
      </div>

      <header className="pt-6">
        <h2 className="font-display text-2xl font-semibold">Neutros</h2>
        <p className="text-muted-foreground text-sm">
          Tons usados em estrutura, texto e separação visual.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {neutralSwatches.map((t) => (
          <div key={t.name} className="space-y-1">
            <div className={`h-16 rounded-lg border ${t.className}`} />
            <div className="font-mono text-xs">{t.name}</div>
          </div>
        ))}
      </div>

      <header className="pt-6">
        <h2 className="font-display text-2xl font-semibold">Semânticas</h2>
        <p className="text-muted-foreground text-sm">
          Comunicam estado (regra de ouro 4: feedback informativo).
        </p>
      </header>
      <div className="grid grid-cols-3 gap-3">
        {semanticSwatches.map((t) => (
          <div key={t.name} className="space-y-1">
            <div className={`h-16 rounded-lg border ${t.className}`} />
            <div className="font-mono text-xs">{t.name}</div>
          </div>
        ))}
      </div>
    </section>
  ),
};

export const Tipografia: Story = {
  render: () => (
    <section className="space-y-8 p-8">
      <header>
        <h2 className="font-display text-2xl font-semibold">Tipografia</h2>
        <p className="text-muted-foreground text-sm">
          Par <strong>Inter</strong> (corpo) + <strong>Sora</strong> (display).
          Justificativa: Inter é otimizada para UI em telas; Sora dá identidade
          ao display sem sacrificar legibilidade. Ambas com{" "}
          <code>display: swap</code> via <code>next/font</code>.
        </p>
      </header>

      <div className="space-y-1">
        <div className="text-muted-foreground font-mono text-xs">
          font-display · 4xl · semibold
        </div>
        <p className="font-display text-4xl font-semibold tracking-tight">
          Organize seus estudos em cadernos conectados.
        </p>
      </div>

      <div className="space-y-1">
        <div className="text-muted-foreground font-mono text-xs">
          font-display · 2xl · semibold
        </div>
        <p className="font-display text-2xl font-semibold">
          Comece por aqui — onboarding integrado ao produto.
        </p>
      </div>

      <div className="space-y-1">
        <div className="text-muted-foreground font-mono text-xs">
          font-sans · base · regular
        </div>
        <p className="text-base">
          Texto de corpo padrão. Toda interação no SurfBook é guiada por
          signos claros e atalhos consistentes — Cmd+K abre a paleta de comandos
          em qualquer tela.
        </p>
      </div>

      <div className="space-y-1">
        <div className="text-muted-foreground font-mono text-xs">
          font-sans · sm · muted
        </div>
        <p className="text-muted-foreground text-sm">
          Texto secundário usado em descrições, dicas e metadados.
        </p>
      </div>
    </section>
  ),
};

export const Raios: Story = {
  render: () => (
    <section className="space-y-4 p-8">
      <header>
        <h2 className="font-display text-2xl font-semibold">Raios</h2>
        <p className="text-muted-foreground text-sm">
          Escala discreta — raios pequenos para inputs, médios para cards,
          maiores para modais. Consistência (regra de ouro 1).
        </p>
      </header>
      <div className="grid grid-cols-4 gap-4">
        {radii.map((t) => (
          <div key={t.name} className="space-y-1">
            <div className={`bg-brand-100 h-20 border ${t.className}`} />
            <div className="font-mono text-xs">{t.name}</div>
          </div>
        ))}
      </div>
    </section>
  ),
};
