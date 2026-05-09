# Heurísticas de design aplicadas — eixo-3

Decisões de produto/UI organizadas por framework heurístico. Cada item aponta o **componente**, a **rota** e/ou o **arquivo** onde a heurística se materializa, com a justificativa.

Frameworks consultados:

- **Norman** — princípios cognitivos de design (Affordance, Mapping, Visibility, Feedback, Constraints, Conceptual Model)
- **Shneiderman** — 8 Golden Rules of Interface Design
- **Nielsen** — 10 Usability Heuristics
- **de Souza (Engenharia Semiótica)** — sistema como mensagem do designer ao usuário; ênfase em comunicabilidade e metalinguagem

A maioria das decisões satisfaz mais de uma heurística — escolhi a primária pra evitar repetição. As secundárias aparecem em parênteses.

---

## 1. Visibilidade do sistema (Nielsen H1, Norman)

> O usuário precisa saber, a qualquer momento, em que estado está o sistema.

| Decisão | Onde | Justificativa |
|---|---|---|
| Indicador "Salvando…" / "Salvo" / "Não salvo" no header da nota | `app/(app)/cadernos/[id]/notas/[noteId]/page.tsx` (linha do `<span aria-live="polite">`) | Auto-save é silent — sem feedback explícito o usuário não sabia se as mudanças foram persistidas. `aria-live` lê pra screen readers também |
| Status do dirty-state via cor + texto | mesmo arquivo, prop `dirty` no `<Button>` | Botão "Salvar" fica `disabled` quando nada mudou — comunica visualmente o que aconteceu sem precisar ler |
| Toast de feedback em todas as mutações (criar/editar/excluir) | `components/ui/toast/toast.tsx` + chamadas em todos os forms | Confirma que ação completou. Variants `success`/`danger` distinguem resultado |
| Contadores no painel do Grafo (X cadernos, Y notas...) | `components/feature/graph-view.tsx`, painel de filtro | Usuário entende o escopo do que está vendo antes de aplicar filtros |
| Status "Cumprido em DD/MM HH:MM" em entidades concluídas | `components/feature/completion-checkbox.tsx` | Não basta o checkbox marcado — o quando importa pra reconstruir histórico |
| Chip colorido por tipo nos calendários | `components/feature/month-calendar.tsx` | Saber instantaneamente se um item no dia X é caderno, nota ou evento sem clicar |

---

## 2. Compatibilidade entre o sistema e o mundo real (Nielsen H2, de Souza)

> Linguagem do usuário, não do sistema.

| Decisão | Onde | Justificativa |
|---|---|---|
| Vocabulário em português PT-BR consistente | toda a app | Personas estudante/ex-estudante são brasileiras. "Caderno" > "Notebook", "Cumprido" > "Completed" |
| Tab "Calendário" no caderno (não "Eventos") | `components/feature/notebook-detail-shell.tsx` (correção feita após feedback do user) | "Eventos" remetia à entidade técnica; "Calendário" é o que o usuário pensa quando quer ver datas |
| "Tarefa cumprida em..." (não "completed") | `components/feature/completion-checkbox.tsx` | Verbo natural em PT-BR pra registro de conclusão |
| "+ Novo" com 4 entidades nomeadas (Caderno, Nota, Tarefa, Evento) | `components/feature/create-button.tsx` | Linguagem direta. Não usa "Item" genérico |
| Datas relativas ("hoje", "amanhã", "em 3 dias", "ontem") | `task-list.tsx`, `upcoming-events-widget.tsx` | Cognitivamente mais próximo do mundo real do que "2026-05-10" |
| **Markdown padrão como formato de export/import** (não JSON proprietário) | `lib/notebook-export.ts` + `lib/notebook-import.ts` | Linguagem que o usuário já conhece de Obsidian/VSCode/GitHub. YAML front-matter + corpo MD. Compatibilidade real com ecossistema — não precisa converter |

---

## 3. Controle e liberdade do usuário (Nielsen H3, Shneiderman G6, Norman)

> Saída clara dos estados, ações reversíveis.

| Decisão | Onde | Justificativa |
|---|---|---|
| **Export de caderno como .zip** (Markdown + YAML front-matter) | `lib/notebook-export.ts` — `downloadNotebookZip()` + items "Exportar como .zip" em `NotebookCard` e `NotebookDetailShell` | Anti lock-in. Usuário pode levar os dados pra Obsidian, VSCode, GitHub, etc. — "saída fácil do estado" levada ao extremo (saída do produto inteiro). Reduz risco percebido de adoção |
| **Import de caderno via .zip** (round-trip do export) | `lib/notebook-import.ts` — botão "Importar" em `/cadernos` | Simétrico ao export — usuário pode trazer cadernos de outros lugares ou de backups. Expressão concreta do "seu dado é seu" |
| Cadernos `system` (tutorial) podem ser **ocultados, não deletados** | `components/feature/notebook-card.tsx` (`toggleHidden`) + `mock-notebook-repository.ts` (throws on delete if `system`) | Erro de exclusão do tutorial é irreversível; ocultar é leve e reversível ("Mostrar de novo" sempre disponível) |
| `Restaurar tutorial` no Cmd+K — **traz de volta** itens ocultos | `command-palette.tsx` | Saída do estado "ocultado" sempre acessível; usuário não fica preso |
| Tarefa cumprida pode ser desmarcada | `task-service.ts` `toggleCompleted` aceita ambos os estados | Erros de "marcar feito" sem terminar de verdade são reversíveis |
| Peek system com botão "Abrir página" + fechar (Esc) | `peek-shell.tsx` | Saída fácil do estado peek. Esc nativo do Radix Dialog. Não força navegação |
| `peekClickHandler` preserva ctrl/cmd/middle-click | `peek-provider.tsx` | Browser-natives (abrir em nova aba) continuam funcionando — usuário não perde poder |
| Confirmação destrutiva em delete (`DeleteNoteDialog`, `DeleteNotebookDialog`) | mesmos arquivos | Toda exclusão pede confirmação explícita |

---

## 4. Consistência e padrões (Nielsen H4, Shneiderman G1)

> Mesma coisa significa a mesma coisa em todo lugar.

| Decisão | Onde | Justificativa |
|---|---|---|
| Topbar "+ Novo" sempre no mesmo canto, em todas as telas | `app/(app)/layout.tsx` | Localização espacial estável — usuário aprende uma vez |
| Cores de tipo consistentes: caderno=indigo, nota=amber, tarefa=emerald, evento=violet, tag=cor própria | `task-list.tsx`, `month-calendar.tsx`, `graph-view.tsx`, `upcoming-tasks-widget.tsx` | Sistema de codificação visual unificado entre 4 contextos diferentes |
| Padrão "+ Novo" → modal/dialog → form | event/task/note dialogs | Mesma estrutura de criação — usuário não precisa reaprender por entidade |
| Padrão Repository + Service + Emitter em todas as entidades | `repositories/*` + `services/*` + `lib/app-bootstrap.ts` | Arquitetura unificada — mesmo modelo mental ao trocar de entidade. Espelha eixo-1 |
| `peek` + `peek shell` reusado em 4 contextos (notebook/note/event/task) | `peek-provider.tsx` + `peek-shell.tsx` | Mesma interação ao clicar em qualquer item de qualquer lista |
| Render-on-default + edit-on-click em todos os blocos de texto | `note-editor.tsx` (HeadingBlock, ParagraphBlock, QuoteBlock, ListBlock items, ChecklistBlock items) | Comportamento idêntico em 5 tipos de bloco — uma única regra: clique pra editar |
| Cmd+K como atalho universal | `app/(app)/layout.tsx` | Convenção de produtos modernos (Linear, Notion, GitHub); reduz custo de aprendizado |

---

## 5. Prevenção de erros (Nielsen H5, Shneiderman G5)

> Melhor evitar o erro do que apenas oferecer mensagens.

| Decisão | Onde | Justificativa |
|---|---|---|
| Sistema flag em cadernos do tutorial bloqueia delete no repo | `mock-notebook-repository.ts` (`if (target.system) throw`) | Constraint de hard-data — UI nem chega a oferecer o botão |
| `dueDate` opcional, mas ao adicionar habilita checkbox de "Cumprido" | `notebook-detail-shell.tsx` + `note editor page` | Sem data, não faz sentido marcar concluído. UI condicional previne ação sem sentido |
| Form de evento valida `endDate ≥ startDate` antes de submit | `event-form-dialog.tsx` | Erro detectado antes do save — mensagem inline imediata |
| Tasks derivadas (notebook/note/event) não podem ter parent reatribuído via UI | `task-list.tsx` (onAddChild só pra `parentType === "task"`) | Hierarquia de entidade é fonte da verdade — UI não permite quebrar |
| Validação ciclo no parent de standalone task | `mock-task-repository.ts` (loop checking ancestor) | Não pode mover task pra debaixo de um descendente próprio |
| Mensagens de erro inline com `aria-describedby` | forms diversos | Erro próximo do campo, sem caça-tesouro |

---

## 6. Reconhecimento em vez de memorização (Nielsen H6, Norman)

> Coisas visíveis valem mais que regras lembradas.

| Decisão | Onde | Justificativa |
|---|---|---|
| Inicial dentro do nó do grafo (C/N/T/E/#) | `graph-view.tsx` + `LegendSwatch` | Não exige que usuário decore "amber = nota". Ainda assim a cor é redundante |
| Legenda visível no painel do grafo (não em tooltip) | `graph-view.tsx`, painel de filtro | Sem precisar lembrar o que cada cor representa |
| Sintaxe do filtro rico documentada na tela do tutorial | `lib/seed-tutorial.ts` (nota Grafo) | Tabela com tokens disponíveis ao alcance da view |
| Autocomplete de tags com sugestões existentes | `tag-selector.tsx` | Reuso > criação. Usuário vê tags já criadas em vez de tentar lembrar o nome exato |
| Outline de headings na sidebar do editor | `components/feature/note-outline.tsx` | Estrutura visível pra notas longas — clica e rola |
| Modal de atalhos via `?` global | `components/feature/shortcuts-help.tsx` | Atalhos disponíveis em qualquer tela |
| Kbd visual nos itens do dropdown (Cmd+K, etc.) | `command-palette.tsx`, `create-button.tsx` | Atalhos descobertos sem decorar |

---

## 7. Flexibilidade e eficiência de uso (Nielsen H7, Shneiderman G3)

> Atalhos pra usuários frequentes, que não atrapalhem novatos.

| Decisão | Onde | Justificativa |
|---|---|---|
| Cmd+K cross-entidade | `command-palette.tsx` | Acesso a qualquer caderno/nota/tarefa/evento sem mouse |
| Filtro rico no grafo (`#tag tipo:nota caderno:nome`) | `graph-service.ts` + `graph-view.tsx` | Usuários avançados filtram com precisão; novatos usam toggles laterais |
| Atalhos no editor (`/`, `[[`, Tab/Shift+Tab, Backspace merge) | `note-editor.tsx` | Power users digitam sem mouse |
| Markdown inline (`**bold**`, `*italic*`, `[link](url)`) | `lib/inline-markdown.tsx` | Quem conhece markdown digita rápido; quem não conhece tem o picker |
| Auto-save evita Cmd+S compulsivo | `cadernos/[id]/notas/[noteId]/page.tsx` (debounce 2s) | Não exige lembrar de salvar |
| Drag pra fixar nó no grafo (Obsidian-style) | `graph-view.tsx` (não solta `fx/fy` no `dragend`) | Power users curam o layout; novatos ignoram |
| Modo de cor toggleable (por tipo / por caderno) | `graph-view.tsx` | Usuário escolhe a leitura mais útil pra ele |
| Peek vs página completa | `peek-provider.tsx` + `peek-shell.tsx` | Power users ficam no contexto; novatos navegam pela página com botão "Abrir" |

---

## 8. Estética e design minimalista (Nielsen H8, Norman)

> Diálogos não devem conter informação irrelevante.

| Decisão | Onde | Justificativa |
|---|---|---|
| Tokens em `oklch()` com paleta limitada | `app/globals.css` | Cores definidas, não soltas no código |
| Ações secundárias em variant `ghost` | `components/ui/button/button.tsx` | Hierarquia visual: primária se destaca, secundárias somem |
| Hover-only revelar ações em cards e tasks | `notebook-card.tsx`, `task-list.tsx`, `note-list-item.tsx` | UI limpa por default; ações aparecem só quando relevantes |
| Labels do grafo desaparecem em zoom < 0.5 | `graph-view.tsx` | Sem ruído visual quando o nó é minúsculo |
| Preview de nota com `line-clamp-2` | `note-list-item.tsx` | 2 linhas é suficiente pra reconhecer; mais é desperdício de scan |
| Render-on-default no editor | `note-editor.tsx` | Inputs vazios escondidos; renderiza markdown como display até hover/click. Editor parece um documento, não um form |

---

## 9. Recuperação de erros (Nielsen H9)

> Mensagens de erro em linguagem clara, indicar problema, sugerir solução.

| Decisão | Onde | Justificativa |
|---|---|---|
| Toasts `variant: "danger"` com descrição explicativa | toda a app | Mensagem clara do que falhou |
| Bootstrap envolve seed em try/catch — falha não quebra login | `lib/app-bootstrap.ts` + `seed-tutorial.ts` | Erro durante seed do tutorial é logado mas não impede o uso da app |
| EmptyState com CTA específico | `components/ui/empty-state/empty-state.tsx` + uses | "Nada aqui ainda. Crie um caderno →" — caminho claro pra resolver |
| Validação inline com `aria-invalid` + texto descritivo | forms diversos | Estado de erro percebido visual + lido por screen readers |
| Tag sem caderno mostra "— Nenhum (livre)" no select | event/task form dialogs | Status claro: não é falha, é uma escolha válida |

---

## 10. Ajuda e documentação (Nielsen H10, de Souza, Shneiderman G7)

> Documentação contextualizada e fácil de buscar.

| Decisão | Onde | Justificativa |
|---|---|---|
| Caderno-tutorial seedado no primeiro login | `lib/seed-tutorial.ts` | Não precisa ler manual — entra na app e vê 8 notas explicando cada entidade |
| Tutorial usa **a própria interface** pra ensinar a interface | mesmo arquivo | Lente semiótica: sistema fala da interface usando os blocos da interface — coerência metalinguística (de Souza) |
| Cross-links entre notas do tutorial + nav prev/next | mesmo arquivo | Usuário pode pular pra qualquer entidade ou seguir em ordem |
| Modal de atalhos via `?` global | `shortcuts-help.tsx` | Documentação acessível sem sair da tela |
| Texto de ajuda no painel do grafo ("Hover destaca vizinhos. Click abre peek.") | `graph-view.tsx` | Affordance verbalizada onde a interação acontece |
| Exemplos concretos no tutorial (`#matemática tipo:nota`) | tutorial nota Grafo | Mostra uso, não só sintaxe |
| Tabela de markdown inline no tutorial | tutorial nota Atalhos | Referência pronta sem sair do tutorial |

---

## 11. Engenharia semiótica (de Souza) — específico

> O sistema é uma **mensagem do designer ao usuário** sobre como comunicar com o sistema. Quanto mais coerente a metalinguagem, mais fácil a apropriação.

| Decisão | Onde | Justificativa |
|---|---|---|
| Tutorial-as-content (não tour modal) | `lib/seed-tutorial.ts` | O sistema usa cadernos pra ensinar cadernos. A própria existência do tutorial *demonstra* que cadernos podem conter aprendizado. Auto-referência metalinguística |
| Sintaxe do filtro rico documentada **no caderno-tutorial dentro da app** | tutorial nota Grafo | Documentação onde o usuário a buscaria, na linguagem em que vai usar |
| Checklist viva no tutorial de Tarefas (items aparecem em `/tarefas`) | tutorial nota Tarefas | O ato de marcar a checkbox **demonstra** o que ela faz. Aprendizagem por uso (Norman: situated learning) |
| Mesma `tag` aparece em qualquer entidade | event/task/notebook/note + `tagService` | Tags são o vocabulário do usuário sobre o conhecimento dele — não devem ter restrição artificial por tipo |
| Cor herdada do caderno (modo "por caderno" no grafo) | `graph-service.ts` `colorMode` | Visualiza famílias conceituais; comunica que entidades de um caderno são "do mesmo assunto" |
| **`README.md` dentro do .zip exportado** explica a estrutura, escolhas (links relativos, imagens não baixadas) e como usar em outros editores | `lib/notebook-export.ts` (constante `README`) | Mensagem metacomunicativa do designer ao usuário: "isso é o que eu te entreguei, e aqui estão minhas limitações honestas". Sistema diz onde começa e termina sua jurisdição |

---

## 12. Modelo conceitual coerente (Norman)

> O modelo do designer (no código) precisa ser visível na interface.

| Decisão | Onde | Justificativa |
|---|---|---|
| 4 entidades nomeadas: Caderno, Nota, Tarefa, Evento | `repositories/*` | Modelo simples, palavras concretas. Sem sub-tipos escondidos |
| Tags são **transversais**, não hierárquicas | `types/tag.ts` + uso em 4 entidades | Modelo de "rede de conhecimento", não de "pasta-arquivo". Reflete na interface (busca cross-entidade no Cmd+K, grafo visualiza) |
| `dueDate` em qualquer entidade que vira "task" | Notebook/Note/Event têm `dueDate` + `completedAt` | "Tudo que tem data pode ser cumprido" — regra única simples |
| Eventos derivados vs standalone visíveis no calendário | `eventService.listAll` agrega 3 fontes | Modelo conceitual do "calendário consolidado" do usuário; agregação invisível no service |
| Multi-level checklist (não Kanban) pras tarefas | `task-list.tsx` | Aderência ao modelo eixo-1 (que era checklist com `parent_id`/`level`); **expectativa pré-existente do usuário** |

---

## 13. Heurísticas de Shneiderman específicas

### G2 — Permitir uso frequente de atalhos

Cobertas em §7 (Flexibilidade). Adicionalmente:
- `Ctrl+S` força save manual com toast (override do auto-save silent) — `cadernos/[id]/notas/[noteId]/page.tsx`
- `Tab` / `Shift+Tab` em listas — `note-editor.tsx`

### G4 — Diálogos com fechamento claro

Toasts e dialogs sempre se fecham automaticamente ou explicitamente; não há estado "preso". `peek-shell.tsx` tem 3 saídas: Esc, X, "Abrir página".

### G7 — Suporte ao locus interno de controle

- Peek system permite ao usuário escolher quando "comprometer" com a navegação completa
- Ordenação de notas é por usuário (4 opções)
- Modo de cor do grafo é por usuário (toggle)
- Modal vs sidebar do peek é por usuário (persistido em localStorage)

### G8 — Reduzir carga de memória de curto prazo

- Cmd+K não exige lembrar onde está cada coisa
- Outline da nota visualiza estrutura sem precisar rolar
- Tags com autocomplete + cor consistente
- Iniciais nos nós do grafo

---

## Resumo — onde cada heurística mais aparece

| Componente / Tela | Heurísticas dominantes |
|---|---|
| `note-editor.tsx` | Consistência, Atalhos, Reconhecimento, Render-on-default |
| `command-palette.tsx` | Atalhos, Flexibilidade, Reconhecimento |
| `graph-view.tsx` | Visibilidade, Modelo conceitual, Flexibilidade, Reconhecimento (legenda + iniciais) |
| `peek-provider.tsx` + `peek-shell.tsx` | Controle do usuário, Consistência, Modelo conceitual |
| `seed-tutorial.ts` | Engenharia semiótica, Ajuda contextualizada, Aprendizagem situada |
| `task-list.tsx` | Modelo conceitual (multi-level), Consistência, Visibilidade |
| `notebook-card.tsx` | Prevenção de erros (system flag), Controle (hidden) |
| `app-bootstrap.ts` | Recuperação de erros (try/catch envolvendo side effects) |
| `notebook-export.ts` + `notebook-import.ts` | Controle do usuário (anti lock-in), Compatibilidade (Markdown padrão), Engenharia semiótica (README do zip) |

---

## Como esta doc se relaciona com o resto

- **`IMPLEMENTATION.md` §8** lista o problema (eixo-1) → solução (eixo-3) → princípio. Esta doc detalha **por heurística** com referência a código.
- **Etapa 4 (testes com usuários)** vai usar este documento como ponto de partida pro consolidado em `docs/testes.md`. Cada problema observado nos testes vira um item no backlog `IMPLEMENTATION.md §7.2`.
- Conexão com a teoria da disciplina: as heurísticas G1 (Norman), G2 (Shneiderman) e G4 (de Souza) do plano de aulas estão todas representadas. Nielsen é incluído pelo recobrimento entre os frameworks.
