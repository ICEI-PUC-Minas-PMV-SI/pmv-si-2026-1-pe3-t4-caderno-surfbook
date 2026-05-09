# Plano de Migração — SurfBook Eixo-3

> Documento técnico-decisório que orienta a reescrita do SurfBook do eixo-1 (HTML/CSS/JS vanilla) para o eixo-3 (Next.js + design system moderno), aplicando os conceitos do microfundamento de Design de Interação.

---

## 1. Diagnóstico do eixo-1

### 1.1 Problema central

> **Usuários não descobrem onde estão as funcionalidades nem entendem o que cada uma faz.**

Esse é o achado dominante dos testes de usabilidade do eixo-1, e é o problema que o redesign do eixo-3 precisa atacar.

### 1.2 Evidências concretas no código atual

| # | Evidência no eixo-1 | Por que é um problema |
|---|---|---|
| E1 | Botão **"+ Adicionar"** existe **apenas no header da página `caderno-lista-v2.html`** (linha 122 de `caderno-lista-v2.html`). | Não há affordance global. Usuário em outra página precisa navegar até "Cadernos" pra criar. |
| E2 | Pra criar uma **nota/conteúdo**, o usuário precisa: login → home → clicar no caderno → entrar no detalhe → clicar em "+ Adicionar". 4 passos sem dica visual. | Caminho longo, opaco. Golfo de execução. |
| E3 | Sidebar mistura entidades inconsistentemente: alguns itens têm "+" sufixo (Cadernos, Tarefas), outros não (Home, Gráfico, Calendário). | Falha de **consistência** (regra de ouro 1) e signos confusos (lente semiótica). |
| E4 | Microcopy genérica: rótulos como "+ Adicionar" sem indicar o que será adicionado. | Falha de comunicabilidade — signos metalinguísticos pobres. |
| E5 | Hierarquia visual fraca: `caderno-lista-v2.html` usa Bootstrap default, sem distinção forte entre ação primária (criar) e secundária. | Violação de Gestalt figura-fundo. |
| E6 | Sem command palette, atalhos de teclado, ou empty states com CTA explícito. | Não há **atalhos pra usuários frequentes** (regra de ouro 3) nem orientação pra novatos. |
| E7 | Stack fragmentada (9 HTML soltos, builder pattern artesanal, ~41 JS, Bootstrap CDN) → divergências visuais entre páginas. | Inconsistência multiplicada por falta de design system. |

### 1.3 Enquadramento teórico

| Lente / Princípio | Diagnóstico |
|---|---|
| **Cognitiva (Norman)** | Golfo de execução grande: signifiers ausentes pra ações comuns. |
| **Semiótica (de Souza)** | Falha de comunicabilidade — signos metalinguísticos (rótulos, ícones) não comunicam intenção do designer. |
| **Gestalt** | Proximidade fraca (ações dispersas), figura-fundo neutra, similaridade não é usada pra agrupar tipos de criação. |
| **8 regras de ouro** | Violadas: 1 (consistência), 3 (atalhos), 5 (prevenção de erro — não há undo/dicas), 8 (carga cognitiva alta). |

---

## 2. Princípios norteadores do redesign

Toda decisão neste plano é justificada por pelo menos um destes eixos:

- **G1 — Gestalt:** proximidade pra agrupar ações por entidade; similaridade pra ações de mesmo tipo; figura-fundo pra destacar primárias.
- **G2 — 8 regras de ouro de Shneiderman:** consistência, atalhos, feedback, fechamento, prevenção/recuperação de erro, controle do usuário, redução de carga, reversibilidade.
- **G3 — Acessibilidade (Unidade 1):** contraste mínimo AA, navegação por teclado, ARIA, foco visível.
- **G4 — Comunicabilidade (lente semiótica):** rótulos ativos e específicos ("Novo caderno" > "+ Adicionar"); ícones acompanhados de texto.
- **G5 — Centrado no usuário (Unidade 2):** prioridade de telas segue jornada testada com personas (estudante, ex-estudante).

---

## 3. Decisões de stack

| Camada | Escolha | Justificativa (DI) |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Roteamento file-based mapeia user flow 1:1; suporta SSR/CSR; ecossistema maduro. Atende H18a (protótipo testável). |
| Estilo | **Tailwind CSS** | Tokens centralizados; consistência forçada; rapidez. |
| Componentes | **shadcn/ui** | Componentes copiados pro repo (não dependência fechada) → permite **justificar gestalt e regras de ouro em cada componente**. |
| Ícones | **lucide-react** | Conjunto coeso; substitui o icons-selector ad-hoc do eixo-1. |
| Tipografia | **Inter** (sans corpo) + **Sora** (sans display) via `next/font` | Par moderno; alta legibilidade; substitui Poppins. |
| Estado | **React Query + Zustand** (UI) | Cache previsível; menos `console.log` debug. |
| Persistência | **localStorage** (mesma estratégia do eixo-1, abstraída em `lib/storage.ts`) | Foco do eixo-3 é interação, não backend. Reduz risco de escopo. |
| Grafo | **react-flow** (substitui `caderno-grapho.html`) | API React-first, melhor manipulação de nós. |
| Editor de notas | **TipTap** | Editor headless rico, acessível. |
| Testes | **Vitest** + **Playwright** (testes de tarefa) | Playwright permite registrar percurso cognitivo automatizado. |

### 3.1 Camada de dados — Repository + Service

Backend permanece **mockado** ao longo de todo o eixo-3 (foco da disciplina é interação, não infra). Para deixar a troca por backend real trivial no futuro, adotamos o padrão **Repository + Service** (referência: `~/code/novelist-app/novelist/src/repositories`).

**Estrutura:**

```
src/
├── lib/
│   └── api.ts                          # isApiEnabled = !!process.env.NEXT_PUBLIC_API_URL + helper fetch
├── repositories/
│   ├── <entidade>-repository.ts        # interface I<Entidade>Repository + tipos
│   ├── index.ts                        # re-exports das interfaces
│   ├── utils.ts                        # simulateDelay() — emula latência de rede
│   ├── mock/
│   │   ├── mock-<entidade>-repository.ts  # implementa interface; usa simulateDelay e localStorage
│   │   ├── data/                       # seeds (caderno-tutorial, exemplos)
│   │   └── index.ts
│   └── api/                            # (vazio no eixo-3) implementações reais futuras
└── services/
    └── <entidade>-service.ts           # fachada; escolhe impl em runtime via isApiEnabled
```

**Regras:**

- Componentes/hooks **consomem services**, nunca repositórios direto. Isso permite trocar a impl sem tocar nas telas.
- Todo método de repositório retorna `Promise<T>` — mesmo se mockado. Forçar async desde o início expõe loading states e erros de UX cedo.
- `simulateDelay(min, max)` em mocks gera latência realista (300–800ms padrão), revelando problemas de feedback (regra de ouro 4).
- Mocks persistem em **localStorage** sob namespace `surfbook-eixo3-*` — sobrevivem a reload.
- Quando alguma entidade ganhar API real, basta criar `repositories/api/<entidade>-api-repository.ts`, registrar no service e setar `NEXT_PUBLIC_API_URL`.

**Entidades planejadas:**

| Repository | Porta de | Fase em que aparece |
|---|---|---|
| `IAuthRepository` | `app/session-manager.js` | Fase 3 (Login) |
| `IUserRepository` | `app/user-client.js` | Fase 3 |
| `INotebookRepository` | `app/notebooks-client.js` | Fase 4 (Lista de Cadernos) |
| `INoteRepository` (metadata + node) | `app/content-metadata-client.js` + `app/content-nodes-client.js` | Fase 6 (Editor) |
| `ITagRepository` | (novo, derivado) | Fase 6 |
| `ITaskRepository` | `app/task-client.js` | Fase 7 |
| `IEventRepository` | `app/events-client.js` | Fase 7 |
| `ISearchRepository` | `app/search-client.js` | Fase 5 |
| `IShareRepository` | `app/share-engine.js` | Fase 6 |

### 3.2 O que NÃO vamos fazer (out of scope)

- Backend próprio / banco de dados real
- Autenticação OAuth real (mockada)
- App mobile nativo (web responsivo basta)
- Sincronização multi-dispositivo
- Internacionalização

### 3.3 Dependências externas adicionadas durante a construção

| Pacote | Tamanho | Por quê | Onde |
|---|---|---|---|
| `cmdk` | ~5kb | Paleta de comandos (Cmd+K) com fuzzy filter built-in | `command-palette.tsx` |
| `@radix-ui/*` | varia | Dialog, DropdownMenu, Tooltip, Toast — primitivas a11y first | `components/ui/*` |
| `lucide-react` | tree-shakable | Iconografia consistente | toda a app |
| `d3` | ~100kb | Force simulation pro grafo (porta a lógica do eixo-1) | `graph-view.tsx` |
| `jszip` | ~50kb | Export/import de caderno como .zip — anti lock-in | `notebook-export.ts` + `notebook-import.ts` |

---

## 4. Design System / Guia de Estilo (H18a)

### 4.1 Tokens

Definidos em `src/app/globals.css` no bloco `@theme inline` (Tailwind v4) e visualizados na story `Design System/Tokens` do Storybook.

```
brand:             escala 50–900 em oklch (≈ #145AF1 em brand-500 — mantém a cor do logo eixo-1)
neutros:           bg / surface / muted / border / foreground (em oklch, perceptualmente uniformes)
semânticas:        success / warning / danger
raios:             sm (6) / DEFAULT (10) / lg (14) / xl (20)
sombras:           sm / DEFAULT / md / lg (soft, discretas)
fontes:            Inter (corpo, --font-sans) + Sora (display, --font-display)
foco:              outline 2px brand-500 com offset 2px em todos os interativos (G3)
transição:         150ms cubic-bezier(0.4, 0, 0.2, 1)
```

### 4.2 Componentes base e seus signos

| Componente | Variantes | Princípio aplicado |
|---|---|---|
| `Button` | primary / secondary / ghost / destructive | G1 figura-fundo (primary destaca-se); G4 rótulos imperativos |
| `Input` | default / error / disabled | G2 feedback (estados); G3 foco visível |
| `Card` | default / interactive | G1 proximidade (agrupa info da entidade) |
| `Modal` | form / confirm / destructive-confirm | G2 prevenção de erro + reversibilidade |
| `Sidebar` | collapsed / expanded | G2 controle do usuário (collapse) |
| `CommandPalette` | global (Cmd+K) | G2 atalhos para usuários frequentes |
| `EmptyState` | with-CTA | G4 comunica próxima ação |
| `Toast` | info / success / error | G2 feedback informativo |

Cada componente é documentado em uma `*.stories.tsx` (Storybook) com variantes, estados e o princípio do microfundamento que aplica.

### 4.3 Direção visual: eixo-1 → eixo-3

A migração técnica anda junto com refresh visual. Inspirações: **Linear**, **Notion**, **Capacities**, **Obsidian** — clean, muito whitespace, brand como acento (não dominante), contraste alto para texto, bordas sutis. Foco em **calma visual** — combina com produto de estudo.

| Elemento | Eixo-1 | Eixo-3 | Princípio aplicado |
|---|---|---|---|
| Stack visual | Bootstrap 5 default + CSS solto por página | Tailwind v4 + tokens centralizados | G2 consistência |
| Tipografia | Poppins (única fonte) | Par **Inter** (corpo) + **Sora** (display) | G3 legibilidade; G1 hierarquia |
| Paleta | azul `#145AF1` + cinzas Bootstrap | brand 50–900 em **oklch** (perceptualmente uniforme), neutros calibrados, semânticas | G1 figura-fundo; G2 feedback |
| Cantos | mistos (`rounded-pill`, `border-radius` variados) | escala consistente `sm/DEFAULT/lg/xl` | G2 consistência |
| Sombras | inexistentes ou Bootstrap default | soft shadows discretas, escaláveis | Ergonomia (não distrai) |
| Densidade | apertada, header e sidebar pesados | espaçamento generoso, hierarquia limpa | G2 redução de carga cognitiva |
| Botões | `btn btn-primary` Bootstrap default | variantes cva (primary/secondary/ghost/destructive) com foco visível | G1 figura-fundo; G3 acessibilidade |
| Sidebar | 280px fixa, mistura "+" inconsistentes nos itens | limpa, agrupada por seção, colapsável, sem `+` no rótulo | G2 consistência; G4 comunicabilidade |
| Microcopy | "+ Adicionar", "Enviar", "Acesse material" | "Novo caderno", "Criar caderno", "Abrir caderno" | G4 comunicabilidade |
| Foco visível | sem outline | `outline: 2px brand-500` em todos os interativos | G3 acessibilidade |
| Empty states | imagem solta + texto plano | ilustração + CTA explícito + dica de atalho | G4 comunicabilidade; G5 onboarding |
| Ícones | Bootstrap Icons, mistura de tamanhos | **lucide-react** wrapper com tamanhos consistentes; sempre acompanhados de texto | G1 similaridade; G4 comunicabilidade |

**O que NÃO muda:**
- Logo (mesmo arquivo, agora em `public/logo.png`)
- Identidade da cor azul de marca (mantida em `brand-500`)
- Conceitos do produto (cadernos, notas, tags, grafo, compartilhamento)

---

## 5. Arquitetura de Informação (resolve o problema central)

### 5.1 Três caminhos pra criar (resolve E1, E2, E4)

| Caminho | Onde | Para quem |
|---|---|---|
| **Botão global "+ Novo"** no header de toda tela, com menu: Caderno / Nota / Tarefa | Sempre visível | Todos os usuários |
| **Command palette (Cmd+K)** — busca + ações ("criar caderno", "criar nota em X") | Atalho de teclado | Usuários frequentes (regra de ouro 3) |
| **Empty states** com CTA explícito ("Crie seu primeiro caderno") | Listas vazias | Novatos (onboarding implícito) |

> Decisão: **a ação "criar" deixa de ser dependente da página atual.** Esse é o coração da resposta ao diagnóstico de descoberta de features.

### 5.2 Caderno-tutorial "Comece por aqui" (resolve E2, E4, E6)

Todo usuário recém-criado recebe automaticamente um **caderno-seed chamado "Comece por aqui"** com notas-exemplo cobrindo:

- **Como criar um caderno** (com print/animação)
- **Como criar uma nota** (com print/animação)
- **Como usar tags pra conectar conteúdos**
- **Como visualizar o grafo**
- **Como compartilhar um caderno**
- **Atalhos de teclado** (Cmd+K, criar nota rápida, etc.)
- **Exemplo de nota com tags reais** ligadas entre si — pra usuário ver o grafo já populado

**Comportamento especial:**

| Regra | Por quê |
|---|---|
| Criado automaticamente no signup | Sistema "se ensina sozinho" — onboarding vive no plano do produto, não em tutorial separado |
| Pode ser **ocultado** do menu principal | G2 controle do usuário — não polui workspace de quem já sabe usar |
| **Não pode ser deletado** | G2 prevenção de erro: usuário sempre pode redescobrir; protege referência permanente |
| Marcado com selo visual ("📘 Tutorial") e fixado no topo | G1 similaridade/figura-fundo — distinto do conteúdo do usuário |
| Acessível via Cmd+K → "Tutorial" mesmo se ocultado | G2 atalhos + reversibilidade |

**Justificativa teórica (microfundamento):**

- **Lente semiótica:** o sistema usa **a própria linguagem dos cadernos** pra ensinar a usar cadernos — coerência metalinguística entre signo e referente. Reduz dissonância entre tutorial e produto.
- **Lente cognitiva:** aprendizagem situada — o usuário aprende a interface usando a interface (Norman: aprender no contexto reduz golfo de execução).
- **Regra de ouro 8 (reduzir carga cognitiva):** não força usuário a memorizar fluxo de tela de ajuda separada.
- **Regra de ouro 5 (prevenção de erro):** ocultar é reversível (mostrar de volta); deletar não existe.
- **Onboarding implícito (Unidade 2):** integra-se à abordagem de design centrado no usuário sem fricção de modal/tour intrusivo.

**Implementação:**

- `lib/seed-tutorial.ts` cria o caderno-tutorial no primeiro login com flag `system: true`
- Schema do caderno ganha campos `system: boolean` e `hidden: boolean`
- UI bloqueia "Excluir" pra cadernos `system: true`; menu de contexto oferece "Ocultar do menu" / "Mostrar de novo"
- Comando "Restaurar tutorial" no Cmd+K e em Configurações

### 5.3 Sidebar — limpeza semiótica (resolve E3)

```
NAVEGAÇÃO
  ◇ Início
  ◇ Cadernos
  ◇ Notas
  ◇ Tarefas
  ◇ Calendário
  ◇ Grafo

CONTA
  ◇ Configurações
  ◇ Sair
```

Removido: o sufixo "+" inconsistente. Ação de criação **só existe via botão global / Cmd+K / empty state** — semântica clara.

### 5.4 Microcopy (resolve E4)

| Eixo-1 | Eixo-3 |
|---|---|
| "+ Adicionar" | "Novo caderno" / "Nova nota" / "Nova tarefa" |
| "Enviar" | "Criar caderno" / "Salvar alterações" |
| "Acesse material" | "Abrir caderno" |
| "Editar" (sozinho) | "Editar caderno" / "Editar nota" |

---

## 6. Mapa de telas (rotas Next.js)

```
src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── cadastrar/page.tsx
├── (app)/
│   ├── layout.tsx                 # Sidebar + Topbar com botão "+" global
│   ├── page.tsx                   # Início (dashboard)
│   ├── cadernos/
│   │   ├── page.tsx               # Lista de cadernos
│   │   └── [id]/
│   │       ├── page.tsx           # Detalhe do caderno + lista de notas
│   │       └── notas/[notaId]/page.tsx   # Editor de nota
│   ├── notas/page.tsx             # Lista global de notas
│   ├── tarefas/page.tsx
│   ├── calendario/page.tsx
│   └── grafo/page.tsx
└── compartilhado/[shareId]/page.tsx
```

### 6.1 Mapeamento eixo-1 → eixo-3

| Eixo-1 | Eixo-3 | Lib/cliente |
|---|---|---|
| `pages/login-v2.html` | `app/(auth)/login/page.tsx` | `lib/auth.ts` (porta `session-manager.js`) |
| `pages/cadastrar-v2.html` | `app/(auth)/cadastrar/page.tsx` | `lib/auth.ts` |
| `pages/caderno-lista-v2.html` | `app/(app)/cadernos/page.tsx` | `lib/notebooks.ts` (porta `notebooks-client.js`) |
| `pages/caderno-detalhe-v2.html` | `app/(app)/cadernos/[id]/page.tsx` | `lib/contents.ts` (porta `content-metadata-client.js`) |
| `pages/caderno-conteudo-v2.html` | `app/(app)/cadernos/[id]/notas/[notaId]/page.tsx` | `lib/contents.ts` + TipTap |
| `pages/caderno-grapho.html` | `app/(app)/grafo/page.tsx` | react-flow + `lib/graph.ts` |
| `pages/caderno-shared.html` | `app/compartilhado/[shareId]/page.tsx` | `lib/share.ts` (porta `share-engine.js`) |
| `pages/caderno-tarefas.html` | `app/(app)/tarefas/page.tsx` | `lib/tasks.ts` (porta `task-client.js`) |
| `pages/caderno-agenda.html` | `app/(app)/calendario/page.tsx` | `lib/events.ts` (porta `events-client.js`) |
| `app/search-client.js` | `services/search-service.ts` + `repositories/search-repository.ts` | mantém Bloom filter / fuzzy no mock |
| `app/storage.js` | `lib/storage.ts` | abstração de localStorage usada pelos mock repos |
| `app/session-manager.js` | `services/auth-service.ts` + `repositories/auth-repository.ts` | repository pattern (§3.1) |
| `app/notebooks-client.js` | `services/notebook-service.ts` + `repositories/notebook-repository.ts` | repository pattern |
| `app/content-*-client.js` | `services/note-service.ts` + `repositories/note-repository.ts` | repository pattern |
| `app/share-engine.js` | `services/share-service.ts` + `repositories/share-repository.ts` | repository pattern |
| `componentes/builder.js` | descartado | substituído por composição React |

---

## 7. Plano de migração — Tiers de componentes + Telas viabilizadas

A reescrita é organizada em **Tiers** de componentes (do átomo para o sistema) onde cada Tier **destrava um conjunto de telas**. Isso permite testar com usuário cedo e em camadas. Alinhado com prototipagem incremental da Unidade 2.

### 7.0 Visão geral — Tier → Telas que ficam viáveis

| Tier | Componentes | Telas viabilizadas | Testável? |
|---|---|---|---|
| **0** | Scaffold (Next.js + Tailwind + tokens + fontes) | Welcome estático | Build smoke test |
| **0.5** | Storybook + a11y addon | Stories de tokens | Auditoria automática de a11y por componente |
| **1** | `Button`, `Input`, `Label`, `FormField`, `Icon` | _(ainda nenhuma tela completa)_ | Stories no Storybook |
| **2** | `Card`, `Badge`, `Tooltip` | Layout estático da Lista de Cadernos | Storybook |
| **3** | `Dialog/Modal`, `Toast`, `DropdownMenu` | **Login**, **Cadastrar**, modais de criação/edição | Click-thru funcional (auth mockada) |
| **4** | `Sidebar`, `Topbar`, `CreateButton` (+Novo), `EmptyState`, `AppShell` | **Home autenticada**, **Lista de Cadernos** com criação global | **🎯 Teste de usabilidade A — descoberta de features** |
| **5** | `CommandPalette` (Cmd+K), `TagInput`, `Avatar/UserMenu` | Cmd+K em qualquer tela; preparo do editor de notas | Teste de atalhos |
| **Telas A** | (composição dos Tiers 1–5) | **Detalhe do Caderno**, **Editor de Nota**, **Compartilhamento** | Jornada completa do caderno até a nota |
| **Telas B** | `KanbanBoard`, `MiniCalendar`, `GraphView` (react-flow) | **Tarefas**, **Calendário**, **Grafo** | Features secundárias |
| **Onboarding** | Caderno-seed "Comece por aqui" (não-deletável, ocultável) | Onboarding implícito ao criar conta | Mede % usuários que abrem o tutorial sozinhos |
| **Polimento** | Auditoria de a11y (axe/Lighthouse), loading states, error boundaries | — | **🎯 Teste de usabilidade B — final, Etapa 4 da disciplina** |

> Observação importante: **a Fase 4 (Tier 4) já permite o primeiro teste de usabilidade real**, antes mesmo das telas-detalhe estarem prontas — basta que a jornada de descoberta (sidebar → topbar → "+Novo" → empty state → modal de criar) esteja viva. Esse é um teste barato e poderoso de **arquitetura de informação pura**.

---

### 7.1 Detalhamento por fase

#### ✅ Fase 0 — Scaffold (concluída)
- [x] Projeto Next.js 16 + TS + Tailwind v4 + Turbopack em `eixo-3/src/`
- [x] Tokens em `app/globals.css` (`@theme inline`, oklch)
- [x] Fontes Inter + Sora via `next/font`
- [x] Logo portada para `public/logo.png`
- [x] `lib/utils.ts` (helper `cn()`); deps `lucide-react`, `cva`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`
- [x] `npm run build` verde

#### ✅ Fase 0.5 — Storybook (concluída)
- [x] Storybook 10 + framework `@storybook/nextjs-vite`
- [x] `.storybook/preview.ts` importa `globals.css` (tokens carregam nas stories)
- [x] Addon `@storybook/addon-a11y` em modo `todo`
- [x] Background switcher (`bg`, `surface`, `muted`)
- [x] Story `Design System/Tokens` (Paleta, Tipografia, Raios)
- [x] `npm run build-storybook` verde

#### ✅ Fase 1 — Tier 1: Primitivos (concluída)
- [x] `Button` (cva: primary/secondary/ghost/destructive/link · sm/md/lg/icon · `asChild` · loading)
- [x] `Input` + `Label` (associação via `useId` + `aria-describedby`; estados error/disabled)
- [x] (decisão) `Icon` wrapper dispensado — usar `lucide-react` direto com `className="size-4 aria-hidden"`
- [x] Stories por componente; painel a11y do Storybook ativo
- **Critério de saída:** ✅ atingido

#### ✅ Fase 2 — Tier 2: Containers (concluída)
- [x] `Card` + `CardHeader/Title/Description/Content/Footer/Cover`
- [x] `Badge` (variantes + cor customizada por hex)
- [x] `Tooltip` (Radix)
- [x] `NotebookCard` composto

#### ✅ Fase 3 — Tier 3: Overlays (concluída)
- [x] `Dialog/Modal` (Radix Dialog · variant destructive)
- [x] `Toast` (Radix · `useToast` hook · success/info/danger)
- [x] `DropdownMenu` (Radix · usado em "+Novo", menus de contexto, transform menu, sort)
- [x] `lib/storage.ts` + `services/auth-service.ts` (Repository pattern)
- [x] Login + Cadastrar funcionais com toast de feedback
- [x] **Bonus:** `IconSelector` + `TagSelector` (com autocomplete de sugestões)

#### ✅ Fase 4 — Tier 4: Shell e descoberta (concluída) **🎯 marco crítico**
- [x] `Sidebar` (limpa, com `aria-current`, hint "em breve" pra rotas futuras)
- [x] `Topbar` (slots Left/Right)
- [x] `CreateButton` ("+ Novo" com DropdownMenu) — **resolve E1**
- [x] `EmptyState` (icon + título + descrição + CTA + hint) — **resolve E6**
- [x] `AppShell` (`app/(app)/layout.tsx` com Sidebar + Topbar + bootstrap de eventos por usuário)
- [x] `ImageSelector` (URL + Upload com compressão + Buscar stub)
- [x] **Telas:** Início (`/`), Lista de Cadernos (`/cadernos`), Novo Caderno, Edit Modal, Delete Modal
- [x] Schema do Notebook com flags `system` / `hidden`
- **Critério de saída:** ✅ atingido — fluxo testável de cadastro → criar caderno

#### ✅ Fase 5 — Tier 5: Avançados (concluída)
- [x] `CommandPalette` (Cmd+K · busca cross-entidade — cadernos, notas, tarefas, eventos · ações "Criar caderno", "Restaurar tutorial", "Ver atalhos")
- [x] `TagSelector` (input com chips · autocomplete · cor aleatória; `colorForTagName` deterministic mantida como utilidade)
- [x] `Avatar` + `UserMenu` (Topbar — Avatar com iniciais, dropdown com Perfil/Configurações/Sair)
- [ ] Portar `search-client.js` para `lib/search.ts` (Bloom filter + fuzzy) — _adiado, cmdk filtra bem o suficiente_

#### ✅ Fase 6 — Sprint de Telas A (concluída)
- [x] **Detalhe do Caderno** (`/cadernos/[id]`) com tabs estilo pasta de arquivos (Notas / Tarefas / Calendário / Grafo), header com cover, breadcrumb, ações
- [x] **Editor de Nota** (`/cadernos/[id]/notas/[noteId]`) com **block editor custom** (10 tipos de bloco; drag handle dedicado; transform menu; slash command; Backspace merge; Tab/Shift+Tab indent em listas; auto-focus em block novo; render-on-default + edit-on-click toggle por bloco)
- [x] **Schema Note com `nodes: NoteNode[]`** (discriminated union) + `markdownToNodes` / `nodesToMarkdown` (importar/exportar)
- [x] **`Note.position`** auto-incrementado por criação + UI com 4 ordens (atualização recente / criação recente / ordem manual / título A→Z)
- [x] **`ImportMarkdownDialog`** como opção de criação de nota
- [x] **Lista global de Notas** (`app/(app)/notas/page.tsx`)
- [x] **Compartilhamento** (`app/compartilhado/[shareId]/page.tsx`) — porta `share-engine.js` com `decodeShare` / `buildShareUrl`
- [x] Menu de contexto do caderno: "Ocultar do menu" / "Mostrar de novo" (regra `system: true` previne delete; ocultar é reversível)
- [x] **Auto-save com debounce 2s** (silent; Cmd+S e clique mantêm toast)
- [x] **Modal de atalhos** (`?` global + item no Cmd+K)
- [x] **Inline `[[` picker** pra referência interna (caderno/nota/bloco) em headings/parágrafos/quotes
- [x] **Inline markdown rendering** (`parseInline`) em todos os blocos no modo render — negrito, itálico, sublinhado, tachado, código, links

#### ✅ Fase 7 — Sprint de Telas B (concluída)
- [x] **Tarefas** (`/tarefas`) — pivot: **multi-level checklist** (não Kanban, decisão de produto). Agrega 5 fontes: standalone tasks, notebook/note/event com `dueDate`, e items de checklist dentro de notas. Hierarquia virtual (caderno como pai de notas/eventos/tarefas filhas; nota com checklist como pai dos items; standalone com `parentId` próprio). Separadores pra cadernos/notas sem `dueDate` que ainda têm filhos. Toggle round-trip em qualquer fonte
- [x] **Calendário** (`/calendario` + `/cadernos/[id]/calendario`) — porta `events-client.js`. `MonthCalendar` próprio (sem dep externa); chips por tipo (caderno/nota/evento) com cores distintas; click → peek
- [x] **Grafo** (`/grafo` + `/cadernos/[id]/grafo` + sidebar do editor de nota) — D3 force simulation com SVG. Hover destaca vizinhos (Obsidian-style); click → peek; arraste → fixa nó. **Filtro rico** com mini-linguagem (`#tag`, `tipo:X`, `caderno:Y`, exclusão com `-`). Modo de cor alternável: por tipo ou por caderno. Inicial dentro de cada nó (C/N/T/E/#) + cor de borda como dupla codificação visual
- [x] **Standalone Event** entity — não previsto no plano original; criado pra suportar lembretes pessoais sem caderno/nota associado
- [x] **Standalone Task** entity — hierarquia multi-nível (parentId/level/position até 8 níveis), prioridade, completedAt
- [x] **Tags em todas as entidades** — não só notebook/note: standalone event e task também. `tagService` agrega de 4 fontes
- [x] **Peek system** (`PeekProvider` + `PeekShell` + `NotebookPeek` + `NotePeek` + `EventFormDialog` + `TaskFormDialog`) — modal/sidebar toggle persistido em localStorage; click intercepta com peek mas preserva ctrl/cmd/middle-click pra navegação direta
- [x] **Widgets no dashboard** — `UpcomingTasksWidget` + `UpcomingEventsWidget` com toggle inline
- [x] **Export/Import de caderno como `.zip`** (`lib/notebook-export.ts` + `lib/notebook-import.ts`) — Markdown padrão + YAML front-matter + reescrita de links internos pra paths relativos. Round-trip preserva estrutura. Compatível com Obsidian/VSCode/Hugo. Anti lock-in
- **Critério de saída:** ✅ atingido — três grandes telas (Tarefas, Calendário, Grafo) na Sidebar + extras: peek system, widgets dashboard, standalone Event/Task, tags em todas, export/import

#### ✅ Fase 8 — Onboarding integrado (concluída)
- [x] `lib/seed-tutorial.ts` cria caderno "Comece por aqui" no primeiro login (idempotente)
- [x] **Reorganizado em uma nota por entidade** (8 notas): overview, cadernos, tags, notas, tarefas, eventos, grafo, atalhos. Cross-links entre todas + nav prev/next no rodapé
- [x] Cada nota demonstra a entidade com blocos reais (a de Tarefas tem checklist viva que aparece em `/tarefas`)
- [x] Selo "Tutorial" no badge do card; sort manual pré-aplicado
- [x] Comando "Restaurar tutorial" no Cmd+K (também desfaz `hidden`)
- **Critério de saída:** ✅ atingido

#### Fase 9 — Polimento e acessibilidade (~½–1 dia)
- [ ] Auditoria de contraste (Lighthouse + axe via Storybook a11y addon)
- [ ] Loading states e error boundaries por tela
- [x] **Atalhos de teclado documentados em `?` (modal de ajuda)** — `components/feature/shortcuts-help.tsx`
- [ ] Responsivo até 360px revisado em todas as telas
- **Critério de saída:** Lighthouse a11y ≥ 95; nenhum erro crítico em axe

#### Fase 10 — Testes com usuários (Etapa 4 da disciplina)
- [ ] Roteiro de tarefas igual ao do eixo-1 (cadastro, criar caderno, criar nota, buscar, ver grafo)
- [ ] Cada integrante aplica o teste com 1 usuário (perfil estudante ou ex-estudante)
- [ ] Consolidação em `docs/testes.md` com métricas comparativas eixo-1 vs eixo-3
- [ ] Aplicar melhorias identificadas → critério "Supera os requisitos" da H20a

### 7.2 Backlog de refinamento de UX

Itens não-bloqueadores identificados durante a construção. Endereçar antes da Etapa 4
(testes com usuários) para reduzir fricção observada:

#### Editor de notas
- [ ] **Backspace merge não-vazio:** ao apertar Backspace no início de bloco com texto,
  fundir com o final do bloco anterior (cursor no ponto de junção)
- [ ] **Focus no fim do prev após merge:** quando Backspace deleta bloco vazio, posicionar
  o cursor no fim do conteúdo do bloco anterior (hoje só foca, não posiciona)
- [ ] **Drag-to-reorder de items dentro de listas/checklists:** hoje só blocos inteiros são
  reordenáveis; itens internos só via Tab/Shift+Tab pra indentação
- [ ] **Slash command com filtro:** hoje `/` abre menu fixo; permitir digitar pra filtrar
  (`/lis` → mostra "Lista" e "Lista de tarefas")
- [x] ~~**Auto-save com debounce**~~ — implementado (2s após parar de digitar; salva silent)

#### Lista de notas / Lista de cadernos
- [ ] **Persistir preferência de ordenação** em localStorage (hoje reseta no reload)
- [ ] **Drag-to-reorder de notas** quando ordem manual estiver ativa (atualiza `position`)
- [ ] **Filtro por tag** na lista de notas

#### Shell
- [ ] **Mobile responsivo:** sidebar fixa quebra abaixo de 768px; precisa de drawer/hamburger
- [ ] **Tooltips nos itens disabled da Sidebar** explicando "em breve"
- [x] ~~**Atalhos de teclado**~~ — implementado (`?` global ou item no Cmd+K)

#### Tags
- [ ] **Tela dedicada de tags** (`/tags` ou `/tags/[name]`) — lista todas as
  tags com contadores e mostra todas as entidades vinculadas a uma tag
  específica (cadernos, notas, tarefas, eventos). Hoje a busca por tag
  funciona via Cmd+K (cmdk filtra pelo `value`), mas falta uma view dedicada
  pra navegar/explorar. Pré-requisito de UX pro grafo do conhecimento.
- [ ] **Drag-to-reorder/indent de tarefas standalone** com restrição: derivadas
  de notebook/note/event/checklist-item não podem mover (hierarquia da entidade
  é imutável)

#### Grafo
- [ ] **Operadores OR no filtro rico** (hoje todos os tokens são AND)
- [ ] **Local graph 1-hop** centrado numa nota (hoje a sidebar do editor mostra
  o grafo do caderno inteiro — ideal seria centrado na nota com vizinhança N hops)
- [ ] **Salvar layout** — posições atuais dos nós em localStorage por escopo
  (hoje reset zera tudo)

---

## 8. Rastreabilidade — problema → solução

| # do diagnóstico | Solução no eixo-3 | Princípio aplicado |
|---|---|---|
| E1 (botão de criar local) | Botão global "+ Novo" no Topbar com 4 entidades (Caderno, Nota, Tarefa, Evento) | G2 consistência, G2 atalhos |
| E2 (caminho longo pra nota) | Cmd+K com busca cross-entidade + "+ Novo > Nota em…" + atalho na sidebar do caderno + peek system (modal/sidebar) que evita full-page navigation | G2 atalhos, G1 proximidade, G2 controle do usuário |
| E3 (sidebar inconsistente) | Sidebar limpa, sem sufixo "+", criação fora dela | G2 consistência, G4 comunicabilidade |
| E4 (microcopy genérica) | Rótulos imperativos específicos | G4 comunicabilidade |
| E5 (hierarquia visual fraca) | Variantes de Button + tokens de cor + tipografia Inter/Sora | G1 figura-fundo |
| E6 (sem atalhos / empty states) | Cmd+K + EmptyState com CTA + caderno-tutorial seed + modal de atalhos `?` | G2 atalhos, G5 onboarding |
| E2/E4/E6 (descoberta + linguagem) | Caderno-seed "Comece por aqui" (não-deletável, ocultável; 8 notas, uma por entidade) | Lente semiótica (auto-referência metalinguística), G2 prevenção/reversibilidade, aprendizagem situada |
| E7 (stack fragmentada) | Next.js + design system unificado | G2 consistência |
| Conexão entre estudos | Tags em todas as entidades + Grafo de conhecimento (D3) com filtro rico | G1 visibilidade do sistema, G3 mapeamento (espacial das relações conceituais) |
| Perda de digitação | Auto-save 2s + status indicator ("Salvando..."/"Salvo") | G2 prevenção de erros, G2 feedback |
| Dispersão de atenção | Peek (modal/sidebar) ao clicar items em listas, calendário, grafo — não força sair do contexto | G2 controle do usuário, G1 proximidade visual |
| Trust / risco percebido de adoção | Export/Import de caderno como `.zip` (Markdown padrão + YAML front-matter, abre em Obsidian/VSCode) | Nielsen H3 controle e liberdade, H2 compatibilidade com mundo real, de Souza (README do zip como mensagem metacomunicativa) |

> Para a justificativa completa por heurística e os componentes/telas onde
> cada uma se aplica, ver [`HEURISTICAS.md`](./HEURISTICAS.md).

---

## 9. Métricas de sucesso (Etapa 4 — testes)

Comparar com baseline do eixo-1 nas mesmas tarefas:

| Métrica | Eixo-1 baseline | Meta eixo-3 |
|---|---|---|
| Tempo até criar primeiro caderno | medir | reduzir ≥ 30% |
| Tempo até criar primeira nota | medir | reduzir ≥ 50% |
| % usuários que abrem o caderno-tutorial sozinhos | n/a | ≥ 70% no 1º acesso |
| % usuários que descobrem Cmd+K sozinhos | n/a | ≥ 30% (com hint) |
| Erros por tarefa | medir | reduzir |
| SUS (System Usability Scale) | medir | ≥ 75 |

---

## 10. Critérios de aceite por fase

Cada fase só fecha quando:

- [ ] TypeScript sem erros, lint limpo
- [ ] Componentes documentados com princípios aplicados
- [ ] Acessibilidade: navegação por teclado funciona; contraste AA
- [ ] Responsivo até 360px
- [ ] Pelo menos um teste de tarefa (Playwright) cobre o fluxo principal da fase

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Escopo grande pra prazo de semestre | Fases curtas; cada fase entrega algo testável; cortar grafo/tarefas/calendário se necessário |
| Aprendizado de Next.js / TipTap consumir tempo | Começar pelos primitivos (Tier 1) e pela autenticação (Tier 3) — telas mais simples; deixar editor rico para a Fase 6 |
| Quebrar dados do eixo-1 | localStorage sob nova chave (`surfbook-eixo3-*`); não migra dados antigos |
| Acessibilidade ficar pra depois | Fase 9 dedicada + Storybook a11y addon roda desde Fase 1; cada componente nasce auditado |
| Tier 4 atrasar e bloquear teste de descoberta | Tier 4 é o gargalo crítico — priorizar; em paralelo, iniciar lib de storage/auth nos Tiers 1–3 |

---

## 12. Próximos passos imediatos

**Concluídas:** Fases 0, 0.5, 1, 2, 3, 4 + boa parte da 5 e 6.

### O que vem agora, em ordem de impacto

1. ➡️ **Fase 5 — finalizar Tier 5**
   - **`CommandPalette` (Cmd+K)** — atalho global. Busca cadernos/notas + ações
     ("Criar caderno", "Criar nota em…", "Ir para tutorial"). Maior valor de DI:
     resolve E6 (atalhos pra usuários frequentes — regra de ouro 3).
   - **`Avatar` / `UserMenu`** no Topbar (hoje só sair via Sidebar)
   - **`lib/search.ts`** — porta do Bloom filter + fuzzy do eixo-1; usado pelo Cmd+K

2. **Fase 8 — Caderno-tutorial seed** (alta alavancagem para testes de Etapa 4)
   - `lib/seed-tutorial.ts` cria "Comece por aqui" no primeiro login
   - Notas-exemplo populadas demonstrando cada feature
   - **Por quê primeiro:** onboarding implícito reduz tempo do "primeiro caderno"
     no teste de usabilidade — métrica direta da H20a

3. **Fase 6 — completar Sprint A**
   - **Lista global de Notas** (`/notas`) — overview cross-caderno
   - **Compartilhamento** (`/compartilhado/[shareId]`) — porta `share-engine.js`
   - Menu de contexto "Ocultar do menu" / "Mostrar de novo"

4. **Fase 7 — Sprint B (features secundárias)**
   - **Tarefas** (Kanban) — porta `task-client.js`
   - **Calendário** — porta `events-client.js`
   - **Grafo** (react-flow) — visualização de links via tags

5. **Fase 9 — Polimento + a11y audit** (Lighthouse / axe via Storybook)

6. **Fase 10 — Testes com usuários** (Etapa 4 da disciplina)

### Backlog de refinamento (§7.2)
Itens não-bloqueadores acumulados durante a construção — endereçar conforme aparecerem
nos testes ou tiver tempo. Ver §7.2 pra lista completa (12 items mapeados em editor /
listas / shell).
