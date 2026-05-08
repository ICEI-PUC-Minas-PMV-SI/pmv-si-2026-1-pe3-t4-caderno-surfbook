# SurfBook — Eixo 3 (`src/`)

Aplicação Next.js 16 / React 19 / Tailwind v4 que reescreve o SurfBook do eixo-1 aplicando os conceitos do microfundamento de Design de Interação.

> Ver `../IMPLEMENTATION.md` para o plano completo de migração, princípios norteadores e mapeamento eixo-1 → eixo-3.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (tokens em `app/globals.css` via `@theme inline`)
- **lucide-react** (ícones)
- **class-variance-authority** + **clsx** + **tailwind-merge** (utilitários de classe)
- **@radix-ui/react-slot** (padrão `asChild`)

## Estrutura

```
src/
├── app/                  # rotas (App Router)
│   ├── globals.css       # design tokens + estilos base
│   ├── layout.tsx        # root layout (fontes Inter + Sora)
│   └── page.tsx          # placeholder Fase 0
├── lib/
│   └── utils.ts          # helper cn()
├── public/
│   └── logo.png          # logo portado do eixo-1
├── package.json
└── tsconfig.json
```

A estrutura crescerá conforme as fases (`(auth)`, `(app)/cadernos/...`, `components/ui/...`) — ver §6 do `IMPLEMENTATION.md`.

## Comandos

```bash
npm run dev      # dev server (Turbopack)
npm run build    # build de produção
npm run start    # serve build de produção
npm run lint     # ESLint
```

## Design tokens

Os tokens estão em `app/globals.css` no bloco `@theme inline`. Cobrem:

- Paleta `brand-50` → `brand-900` (mantém a cor azul do logo do eixo-1)
- Neutros (`bg`, `surface`, `border`, `muted`, `foreground`)
- Semânticos (`success`, `warning`, `danger`)
- Raios, sombras e transição padrão

Cada token é justificado no relatório `../docs/design.md` pelos princípios do microfundamento (Gestalt, lentes cognitiva/semiótica, 8 regras de ouro de Shneiderman).
