import { markdownToNodes } from "@/lib/markdown-nodes";
import { saveSort } from "@/lib/notes-sort";
import { colorForTagName } from "@/components/ui/tag-selector/tag-selector";
import { eventService } from "@/services/event-service";
import { noteService } from "@/services/note-service";
import { notebookService } from "@/services/notebook-service";
import { taskService } from "@/services/task-service";
import type { Tag } from "@/types/tag";

/**
 * Caderno-tutorial "Comece por aqui" — onboarding implícito pelo próprio
 * produto. Uma nota por entidade do sistema, demonstrando a feature com
 * blocos reais.
 *
 * Ordem pedagógica (de Souza, lente semiótica):
 * 1. Overview — mapa mental das 4 entidades
 * 2. Cadernos — o organizador
 * 3. Tags — o conector cross-entidade (vem antes de notas pra estabelecer
 *    o conceito antes de demonstrar o uso)
 * 4. Notas — o conteúdo rico (incorpora demo de blocos)
 * 5. Tarefas — afazeres + checklist multi-nível
 * 6. Eventos — calendário
 * 7. Grafo — visualização das conexões + filtro rico
 * 8. Atalhos — speedrun do teclado
 *
 * Princípios:
 * - Lente semiótica (de Souza): o sistema usa a própria linguagem dos
 *   cadernos pra ensinar a usar cadernos — coerência metalinguística.
 * - Cognitiva (Norman): aprendizagem situada — usuário aprende a interface
 *   usando a interface.
 * - G2 Shneiderman 5 (prevenção de erro): bloqueado de exclusão; pode ser
 *   ocultado mas não deletado. Reversível via "Restaurar tutorial" no Cmd+K.
 *
 * Idempotente — só semeia se o usuário ainda não tem caderno `system: true`.
 *
 * Cross-links: cada nota referencia tópicos relacionados via placeholders
 * `{{slug}}`. Como `surfbook://note/<nbId>/<noteId>` exige IDs reais, fazemos
 * em duas passadas: criamos as notas (capturando os IDs), depois substituímos
 * os placeholders e atualizamos cada nota com o conteúdo final + nav prev/next.
 */

const TUTORIAL_NAME = "Comece por aqui";
const TUTORIAL_DESCRIPTION =
  "Tutorial interativo do SurfBook. Uma nota por entidade do sistema — explore na ordem ou pulando.";
const TUTORIAL_ICON = "graduation-cap";

interface NoteSeed {
  slug: string;
  title: string;
  markdown: string;
  tags?: Tag[];
}

function tag(name: string): Tag {
  return { id: crypto.randomUUID(), name, color: colorForTagName(name) };
}

const NOTES: NoteSeed[] = [
  {
    slug: "overview",
    title: "🗺 Como o SurfBook funciona",
    tags: [tag("tutorial"), tag("overview")],
    markdown: `# Como o SurfBook funciona

O SurfBook é um sistema de **estudo conectado**. Tudo gira em torno de quatro entidades — vamos olhar uma por uma nas próximas notas.

## 📚 Cadernos — os organizadores

Agrupam o que pertence a um mesmo tema, projeto ou disciplina. Cada caderno tem nome, capa, ícone, descrição, tags e (opcionalmente) data limite. → Próxima nota: [cadernos]({{cadernos}}).

## 🏷 Tags — o conector cross-entidade

Tags vivem em **qualquer entidade** — caderno, nota, tarefa ou evento. Usar a mesma tag em itens diferentes os liga numa rede. → [tags]({{tags}}).

## 📝 Notas — o conteúdo rico

Texto em blocos tipados (títulos, listas, checklists, código, citações, imagens). Suporta **negrito**, *itálico*, links internos com \`[[\` e referências cruzadas. → [notas]({{notas}}).

## ✅ Tarefas — o que fazer

Coisas a cumprir, com hierarquia multi-nível. Tudo que tem **data limite** (caderno, nota, evento) também aparece como tarefa pra ser checada. → [tarefas]({{tarefas}}).

## 📅 Eventos — quando acontece

Lembretes pessoais com data. Convivem no calendário com cadernos/notas que tenham prazo. → [eventos]({{eventos}}).

## 🕸 Grafo de conhecimento

Tudo isso convive num **grafo visual** estilo Obsidian. As arestas são as tags compartilhadas e os links internos. Filtro rico pra focar (\`#tag\`, \`tipo:nota\`, \`caderno:nome\`). → [grafo]({{grafo}}).

## 📦 Seu dado é seu

Cadernos podem ser **exportados como .zip** (Markdown padrão + YAML front-matter, abre direto no Obsidian/VSCode/etc.) e **importados de volta**. Anti lock-in. Detalhes em [cadernos]({{cadernos}}).

---

## Por onde começar

- [ ] Continue pelas próximas notas em ordem
- [ ] Crie seu primeiro caderno real
- [ ] Adicione duas notas com uma tag em comum
- [ ] Use [Ctrl+K]({{atalhos}}) pra navegar rápido

Quando estiver confortável, pode ocultar este tutorial pelo menu **⋮** no card do caderno (e restaurar depois pelo Cmd+K).`,
  },
  {
    slug: "cadernos",
    title: "📚 Cadernos",
    tags: [tag("tutorial"), tag("cadernos")],
    markdown: `# Cadernos — os organizadores

Cadernos agrupam o que pertence ao mesmo tema. Pense numa pasta de fichário: o material da prova de cálculo, o diário de leitura, as anotações da aula de design.

## O que cada caderno tem

- **Nome** — obrigatório
- **Ícone** — visual rápido na sidebar e cards
- **Capa** — imagem opcional pro card
- **Descrição** — pra dar contexto
- **Tags** — conexões cross-entidade (veja [tags]({{tags}}))
- **Data limite** (opcional) — quando definida, vira tarefa e aparece no calendário

## Como criar

- Clique em **+ Novo → Caderno** no topo
- Ou \`/cadernos/novo\`
- Ou pelo Cmd+K → "Criar caderno"

## Dentro de cada caderno

Três abas:

1. **Notas** — texto rico em blocos
2. **Tarefas** — afazeres do caderno
3. **Calendário** — datas relacionadas (caderno + suas notas + eventos vinculados)

## Ocultar e restaurar

Se um caderno deixou de ser útil, no menu **⋮** do card escolha "Ocultar do menu". Ele continua existindo (não é destrutivo) mas some da listagem. Pra trazer de volta: clique em "Mostrar ocultos" na lista, ou use Cmd+K.

> O caderno-tutorial é \`system: true\` — não pode ser deletado, só ocultado. Salvaguarda contra arrependimento.

## 📦 Exportar e importar

**Seu dado é seu.** O SurfBook não te prende — qualquer caderno pode ser exportado e re-importado a qualquer momento.

### Exportar como .zip

No menu **⋮** do card (ou no \`⋮\` dentro do caderno aberto): **"Exportar como .zip"**. Você baixa um arquivo com:

\`\`\`
caderno-nome.zip
├── README.md       ← origem + instruções
├── index.md        ← metadata + sumário das notas
└── notes/
    ├── 01-titulo.md
    ├── 02-outra-nota.md
    └── …
\`\`\`

Cada \`.md\` tem **YAML front-matter** com tags, datas e contexto. Compatível direto com:

- **Obsidian** — abre como vault
- **VSCode** — extensões de Markdown
- **Hugo / Jekyll / Astro** — gerar site estático
- **GitHub** — versionar como prosa

Links internos entre notas do caderno são reescritos pra paths relativos (\`./outra-nota.md\`). Refs cross-caderno viram texto comentado ("nota externa") já que estão fora do escopo exportado.

### Importar .zip

Na lista de cadernos, botão **"Importar .zip"**. Aceita:

- Zips exportados pelo próprio SurfBook (round-trip perfeito — só os IDs mudam)
- Qualquer .zip com \`.md\` + YAML front-matter compatível
- Pastas estilo Obsidian ou notas soltas — desde que o front-matter siga o formato (title, tags, dueDate)

Sem \`index.md\`? O nome do arquivo \`.zip\` vira o nome do caderno. Sem front-matter? O título vem do primeiro \`# H1\` da nota.

### Por que isso importa

- **Backup pessoal** — guarde no Drive, GitHub, USB
- **Migração** — mova entre dispositivos
- **Edição offline** — abra no Obsidian, edite, importe de volta
- **Compartilhamento real** — mande o .zip pra alguém

> Imagens são URLs externas no markdown — não são empacotadas no .zip. Sem backend, baixar com CORS é fora do escopo. Pra auto-contido, salve manualmente.`,
  },
  {
    slug: "tags",
    title: "🏷 Tags",
    tags: [tag("tutorial"), tag("tags"), tag("organização")],
    markdown: `# Tags — o conector cross-entidade

Tags são o fio condutor entre tudo no SurfBook. Diferente de pastas (que segregam), tags **conectam**: o mesmo \`#álgebra-linear\` pode aparecer num caderno de matemática, numa nota de machine learning, numa tarefa de exercícios e num evento de prova.

## Onde uso tags

Em **qualquer entidade**:

- [Cadernos]({{cadernos}}) — pra categorizar tema/disciplina
- [Notas]({{notas}}) — pra ligar conteúdo cruzado
- [Tarefas]({{tarefas}}) — pra agrupar afazeres por tópico
- [Eventos]({{eventos}}) — pra prazos relacionados

## Como funcionam

- Adicione tags em qualquer formulário (caderno, nota, evento, tarefa)
- Comece a digitar — autocomplete sugere tags já existentes; Enter cria nova
- Cada tag tem cor consistente em todo lugar (gerada deterministicamente pelo nome)

## Buscando por tag

Cmd+K → digite o nome da tag. A busca filtra cadernos, notas, tarefas e eventos que tenham aquela tag. Cross-entidade num só lugar.

> Em breve: tela dedicada \`/tags\` com lista completa e visualização de todas as entidades por tag.

## Dica de uso

Pense em tags como **dimensões ortogonais** ao caderno. Caderno = "onde está armazenado". Tag = "sobre o que é". Uma nota pode estar no caderno **Cálculo** mas ter tags \`#derivada\`, \`#prova\`, \`#exemplo\` — três facetas separadas.

Quanto mais consistente o uso, mais valioso fica o grafo de conhecimento (em breve).`,
  },
  {
    slug: "notas",
    title: "📝 Notas",
    tags: [tag("tutorial"), tag("notas"), tag("blocos")],
    markdown: `# Notas — o conteúdo rico

Cada nota é uma sequência de **blocos tipados**. Você mistura quantos quiser pra construir o que precisar.

## Tipos de bloco

### Texto

Parágrafos como este. Suportam **negrito**, *itálico*, __sublinhado__, ~~tachado~~ e \`código inline\`.

### Listas

- Bullet item
- Outro item
- Mais um

1. Lista numerada
2. Útil pra passos sequenciais
3. Ou prioridades

### Lista de tarefas (checklist)

- [x] Esta vira uma tarefa de verdade — aparece em [tarefas]({{tarefas}})
- [ ] Marque o checkbox em qualquer view e sincroniza nas duas
- [ ] Indent com Tab cria sub-tarefa na hierarquia

### Citação

> "Aprender é descobrir aquilo que você já sabe."

### Código

\`\`\`js
function hello(name) {
  return \`Olá, \${name}!\`;
}
\`\`\`

### Divisor

---

## Como adicionar blocos

- Botão **+ Adicionar bloco** no fim da nota
- Hover num bloco e clique no \`+\` que aparece à esquerda
- Pressione **\`/\`** num parágrafo vazio pra abrir o menu rápido — veja [atalhos]({{atalhos}})

## Linkando entre notas

- **Markdown padrão:** \`[texto](url)\` — funciona com URLs externas e internas
- **Picker rápido:** digite **\`[[\`** em qualquer texto pra abrir busca de cadernos/notas/blocos pra referência interna

## Tags + Data + Conclusão

- Adicione [tags]({{tags}}) na barra abaixo do título — autocomplete reutiliza
- Defina **data limite** se vira algo a fazer — aparece no calendário e em tarefas
- Quando concluído, marque o checkbox de "Cumprido" — fica registrado quando

## Compartilhamento

Menu **⋮** → "Copiar link compartilhável" gera URL pública somente-leitura com snapshot da nota. Usuário sem conta pode ler.`,
  },
  {
    slug: "tarefas",
    title: "✅ Tarefas",
    tags: [tag("tutorial"), tag("tarefas")],
    markdown: `# Tarefas — afazeres conectados

Tarefas no SurfBook não são uma entidade isolada — são uma **view consolidada** de tudo que precisa ser cumprido.

## O que entra na view de tarefas

Quatro fontes alimentam \`/tarefas\`:

1. **Cadernos** com data limite — viram tasks no nível raiz
2. **Notas** com data limite — agrupam-se sob o caderno delas
3. **Eventos** — todos têm data por definição; ficam sob o caderno (se vinculados)
4. **Tarefas standalone** — afazeres avulsos com hierarquia multi-nível própria

Bonus:
5. **Itens de checklist dentro de notas** — cada checkbox que você marca numa nota aparece como sub-tarefa daquela nota.

## Sub-tarefas

Tarefas standalone podem ter filhos. No hover, clique no \`+\` ao lado da tarefa pra criar sub-tarefa. Hierarquia até 8 níveis. Cadernos sem data, mas com filhos, viram **separadores** (header sem checkbox) pra dar contexto visual.

## Marque progresso

Lista interativa abaixo — vai cumprindo conforme avança no tutorial:

- [ ] Criei meu primeiro caderno real
- [ ] Adicionei minha primeira nota
- [ ] Marquei uma tarefa como cumprida
- [ ] Criei uma tarefa standalone com prioridade
- [ ] Vi um item de checklist aparecer em /tarefas

> Cada item acima é uma checklist-item. Marque um e veja em \`/tarefas\` — espelho automático.

## Filtros

- **Pendentes** vs **Concluídas** — separadas em seções
- Concluídas riscadas e dimmed
- Tarefa marcada concluída registra \`completedAt\` (e desmarcar limpa)

## Tags em tarefas

Tarefa standalone aceita [tags]({{tags}}) também — busca por tag no Cmd+K traz tarefas vinculadas.`,
  },
  {
    slug: "eventos",
    title: "📅 Eventos",
    tags: [tag("tutorial"), tag("eventos")],
    markdown: `# Eventos — o calendário

Eventos são lembretes pessoais com data. Diferente de tarefas (que podem não ter data), todo evento **tem data por definição** — é o que os faz aparecer no calendário.

## Onde aparecem

- \`/calendario\` global — vista mensal consolidada
- Aba **Calendário** dentro do caderno — só os eventos vinculados a ele
- Widget no dashboard — próximos prazos
- \`/tarefas\` — eventos também são tarefas (têm que ser cumpridos)

## O que cada evento tem

- **Nome** + descrição
- **Data início/fim** — eventos de um ou múltiplos dias
- **Prioridade** opcional (alta/média/baixa)
- **Caderno** opcional — se vinculado, aparece no calendário do caderno também
- **Tags** — pra conectar a outras entidades (veja [tags]({{tags}}))
- **Cumprido em** — checkbox pra marcar feito

## Eventos derivados vs standalone

- **Derivados:** caderno ou nota com \`dueDate\` viram um item no calendário automaticamente. Não são entidade própria — só uma projeção do prazo.
- **Standalone:** \`+ Novo → Evento\` cria entidade independente. Útil pra coisas que não cabem como conteúdo: "consulta médica", "reunião com prof", "prova".

Os dois aparecem no mesmo calendário, com cores diferentes:
- 🟦 caderno (brand)
- 🟨 nota (amber)
- 🟪 evento standalone (violet)

## Click → peek

Clique num chip de evento no calendário e abre **peek** (modal/sidebar) com os detalhes. Botão "abrir página" leva pra view completa quando precisa. Mesmo padrão de cadernos e notas — não força sair do contexto corrente.

## Próximos passos

- [ ] Crie um evento standalone "[teste]" pra amanhã
- [ ] Marque como cumprido pelo widget do dashboard
- [ ] Veja-o desaparecer da lista de "próximos prazos"`,
  },
  {
    slug: "grafo",
    title: "🕸 Grafo de conhecimento",
    tags: [tag("tutorial"), tag("grafo")],
    markdown: `# Grafo de conhecimento

O grafo é a vista mais "épica" do SurfBook — ele mostra **todas as suas entidades como nós** e **todas as relações como arestas**. Inspirado no Obsidian, com filtro rico pra você focar onde precisar.

## O que cada coisa é

Cada nó tem uma **inicial dentro** + **cor de borda** que diz o tipo:

- **C** — Caderno (vazado)
- **N** — Nota (vazado)
- **T** — Tarefa (vazado **tracejado**)
- **E** — Evento (vazado)
- **#** — Tag (preenchido, cor da própria tag)

## Modo de cor

No painel você alterna entre dois modos:

- **Por tipo** (default) — todas as entidades do mesmo tipo compartilham cor. Caderno=indigo, nota=amber, tarefa=emerald, evento=violet. Útil pra distinguir tipos à vista.
- **Por caderno** — cada caderno ganha cor única (hash do nome); suas notas, tarefas e eventos vinculados **herdam** essa cor. Útil pra ver "famílias" — quais entidades pertencem juntas.

Tags mantêm cor própria nos dois modos.

## Arestas

As conexões são:

- Caderno → conteúdo (nota/tarefa/evento)
- Entidade ↔ tag (afinidade conceitual)
- Nota → outra nota (links internos com \`[[\` ou \`[texto](surfbook://...)\`)

## Interações

- **Hover** num nó → ele e seus vizinhos diretos ficam destacados; resto fica fraco
- **Click** → abre o peek do item (modal/sidebar — sem sair do grafo)
- **Arraste** → fixa o nó na posição (estilo Obsidian "pin")
- **Scroll** → zoom; **drag no fundo** → pan
- **Reset** desafixa tudo e volta o zoom

## Filtro rico

O campo "Filtro rico" no painel aceita uma mini-linguagem de busca. Você pode combinar tokens (separados por espaço — todos AND):

| Token | O que faz |
|-------|-----------|
| \`palavra\` | Substring no label do nó |
| \`#tag\` | Entidades com essa tag (e o nó da tag) |
| \`-#tag\` | Exclui entidades com essa tag |
| \`tag:nome\` | Igual a \`#nome\` |
| \`tipo:nota\` | Só notas (aliases: \`type:note\`, \`tipo:caderno\`, \`tipo:tarefa\`, \`tipo:evento\`, \`tipo:tag\`) |
| \`caderno:nome\` | Escopo num caderno (substring no nome) |

### Exemplos

- \`#matemática\` — só itens taggeados com matemática + a tag em si
- \`tipo:tarefa #urgente\` — tarefas com tag urgente
- \`caderno:cálculo tipo:nota\` — notas dentro do caderno cálculo
- \`-#arquivado\` — esconde tudo arquivado
- \`prova\` — qualquer nó cujo label tenha "prova"

> Múltiplos \`#tag\` significam **AND** — entidade precisa ter todas. Pra OR, abra dois grafos lado a lado por enquanto (v2 vai suportar).

## Vistas locais

- \`/grafo\` global — tudo
- Aba **Grafo** dentro de um caderno — só entidades daquele caderno
- Sidebar do editor de nota — minimapa com [outline]({{notas}}) abaixo

## Por que isso importa

Tags são a alma do grafo. Quanto mais consistente seu uso, mais o grafo revela conexões que você não tinha percebido. Veja também a discussão em [tags]({{tags}}).`,
  },
  {
    slug: "atalhos",
    title: "⌨ Atalhos",
    tags: [tag("tutorial"), tag("atalhos")],
    markdown: `# Atalhos do teclado

Ser rápido importa. Estes são os atalhos universais.

## Globais

- **Ctrl+K** (ou ⌘K no Mac) — paleta de busca/comandos. Busca cross-entidade: cadernos, notas, tarefas, eventos. Filtra por nome ou por [tag]({{tags}}).
- **?** (Shift + /) — abre este modal de ajuda em qualquer lugar (exceto dentro de input de texto)
- **Ctrl+S** — salva a nota corrente (auto-save em 2s já cuida do resto)

## Editor de notas

- **Enter** num parágrafo → novo parágrafo abaixo
- **Enter** num título → vai pra parágrafo abaixo
- **Enter** numa lista → novo item da lista
- **Backspace** num bloco vazio → remove e foca o anterior
- **Tab** num item de lista → indenta (sub-item)
- **Shift+Tab** → desfaz indentação
- **\`/\`** num parágrafo vazio → menu de [tipos de bloco]({{notas}})
- **\`[[\`** em qualquer texto → picker de referência interna pra outra nota/caderno/bloco

## Reordenar blocos

Cada bloco tem um \`⋮⋮\` no gutter à esquerda — segure e arraste pra reordenar.

## Texto inline (markdown)

- \`**negrito**\` → **negrito**
- \`*itálico*\` → *itálico*
- \`__sublinhado__\` → <u>sublinhado</u>
- \`~~tachado~~\` → ~~tachado~~
- \`\\\`código\\\`\` → \`código\`
- \`[texto](url)\` → link (use \`surfbook://...\` pra interno)`,
  },
];

export async function seedTutorialIfNeeded(): Promise<void> {
  try {
    const all = await notebookService.list();
    const hasTutorial = all.some((n) => n.system);
    if (hasTutorial) return;

    const tutorial = await notebookService.create({
      name: TUTORIAL_NAME,
      description: TUTORIAL_DESCRIPTION,
      iconName: TUTORIAL_ICON,
      tags: [tag("tutorial")],
      system: true,
    });

    saveSort(tutorial.id, "position");

    // Pass 1: cria notas com markdown bruto (placeholders preservados)
    const created: { slug: string; id: string }[] = [];
    for (const noteSeed of NOTES) {
      const note = await noteService.create({
        notebookId: tutorial.id,
        title: noteSeed.title,
        nodes: markdownToNodes(noteSeed.markdown),
        tags: noteSeed.tags ?? [],
      });
      created.push({ slug: noteSeed.slug, id: note.id });
    }

    const slugToId = new Map(created.map((c) => [c.slug, c.id]));

    function refFor(slug: string): string | null {
      const id = slugToId.get(slug);
      return id ? `surfbook://note/${tutorial.id}/${id}` : null;
    }

    // Pass 2: substitui placeholders + nav prev/next
    for (let i = 0; i < NOTES.length; i++) {
      const seed = NOTES[i];
      const noteId = created[i].id;
      const prev = i > 0 ? NOTES[i - 1] : null;
      const next = i < NOTES.length - 1 ? NOTES[i + 1] : null;

      let body = seed.markdown.replace(/\{\{([a-z-]+)\}\}/g, (match, slug) => {
        const url = refFor(slug);
        return url ?? match;
      });

      const navParts: string[] = [];
      if (prev) {
        const url = refFor(prev.slug);
        if (url) navParts.push(`← [${prev.title}](${url})`);
      }
      if (next) {
        const url = refFor(next.slug);
        if (url) navParts.push(`[${next.title}](${url}) →`);
      }
      if (navParts.length > 0) {
        body += `\n\n---\n\n${navParts.join("  ·  ")}`;
      }

      await noteService.update(noteId, {
        nodes: markdownToNodes(body),
      });
    }

    // Semeia entidades-exemplo vinculadas ao tutorial — assim o usuário
    // já vê tarefas/eventos reais aparecendo em /tarefas, /calendario e
    // no grafo desde o primeiro login.
    await seedExampleEntities(tutorial.id);
  } catch (err) {
    console.error("[seedTutorial]", err);
  }
}

/**
 * Cria 2 eventos standalone, 1 árvore de tarefas (root + 2 sub-tarefas) e
 * 1 tarefa avulsa, todos vinculados ao caderno-tutorial. Datas relativas
 * ao "hoje" do primeiro login pra os exemplos parecerem vivos
 * (próximos prazos, datas no calendário).
 *
 * Idempotência: já protegido pelo `if (hasTutorial) return` no caller —
 * só roda no primeiro login.
 */
async function seedExampleEntities(notebookId: string): Promise<void> {
  function isoDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  const exampleTags = [tag("tutorial"), tag("exemplo")];

  // ---------- Eventos ----------
  await eventService.createStandalone({
    name: "Revisar o tutorial",
    description: "Passar pelas 8 notas e marcar tudo como cumprido",
    startDate: isoDate(0), // hoje
    priority: "high",
    notebookId,
    tags: exampleTags,
  });
  await eventService.createStandalone({
    name: "Explorar o grafo de conhecimento",
    description: "Ver as conexões entre as notas do tutorial",
    startDate: isoDate(1), // amanhã
    priority: "medium",
    notebookId,
    tags: exampleTags,
  });

  // ---------- Tarefas com hierarquia ----------
  const rootTask = await taskService.createStandalone({
    title: "Criar meu primeiro caderno real",
    description: "Pode ser de uma matéria, projeto ou diário pessoal",
    dueDate: isoDate(2),
    priority: "high",
    notebookId,
    tags: exampleTags,
  });
  await taskService.createStandalone({
    title: "Adicionar 2-3 notas no caderno",
    parentId: rootTask.id,
    notebookId,
    tags: exampleTags,
  });
  await taskService.createStandalone({
    title: "Usar a mesma tag em duas delas pra ver o grafo conectar",
    parentId: rootTask.id,
    notebookId,
    tags: exampleTags,
  });

  // Tarefa standalone solta (sem parent) — demonstra o nível raiz
  await taskService.createStandalone({
    title: "Marcar este item como cumprido pra ver o efeito",
    dueDate: isoDate(0),
    priority: "low",
    notebookId,
    tags: exampleTags,
  });
}
