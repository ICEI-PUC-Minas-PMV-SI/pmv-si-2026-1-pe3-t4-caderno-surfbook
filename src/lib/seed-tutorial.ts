import { markdownToNodes } from "@/lib/markdown-nodes";
import { saveSort } from "@/lib/notes-sort";
import { colorForTagName } from "@/components/ui/tag-selector/tag-selector";
import { noteService } from "@/services/note-service";
import { notebookService } from "@/services/notebook-service";
import type { Tag } from "@/types/tag";

/**
 * Caderno-tutorial "Comece por aqui" — onboarding implícito pelo próprio
 * produto. Cada nota demonstra uma feature usando os blocos reais. Não há
 * tour intrusivo: o usuário aprende usando.
 *
 * **Princípios:**
 * - **Lente semiótica (de Souza):** o sistema usa a própria linguagem dos
 *   cadernos para ensinar a usar cadernos — coerência metalinguística.
 * - **Cognitiva (Norman):** aprendizagem situada — usuário aprende a
 *   interface usando a interface.
 * - **G2 Shneiderman 5 (prevenção de erro):** bloqueado de exclusão; pode
 *   ser ocultado se o usuário não quiser ver mais. Reversível via "Restaurar
 *   tutorial" no Cmd+K.
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
  "Tutorial interativo do SurfBook. Cada nota demonstra uma feature usando blocos reais — explore na ordem ou pulando.";
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
    slug: "intro",
    title: "🗺 Como o SurfBook funciona",
    tags: [tag("tutorial"), tag("intro")],
    markdown: `# Como o SurfBook funciona

O SurfBook é um sistema de **estudo conectado**. Tudo gira em torno de quatro entidades — vamos olhar uma por uma.

## 📚 Cadernos — os organizadores

Cadernos agrupam o que pertence a um mesmo tema, projeto ou disciplina. Cada caderno tem nome, capa, ícone, descrição e tags.

> Pense num caderno como uma pasta de fichário: o material da prova de cálculo, o diário de leitura, as anotações da aula de design.

Dentro de cada caderno você encontra três tipos de conteúdo:

1. **Notas** — texto rico em blocos
2. **Tarefas** — coisas a fazer
3. **Eventos** — lembretes com data

## 📝 Notas — o que se conecta

Notas são onde você escreve de fato. Cada nota é feita de [blocos tipados]({{blocos}}): títulos, listas, checklists, código, imagens, citações.

O que torna as notas especiais é a **conexão por tags**. Se você marca duas notas com a mesma [tag]({{tags}}) — mesmo em cadernos diferentes — elas viram parte da mesma rede de conhecimento.

- Tags são reutilizáveis (autocomplete sugere as que você já usou)
- A mesma tag mantém a mesma cor em todo lugar
- Cada nota pode ter quantas tags fizer sentido

## ✅ Tarefas — o que fazer

> Em breve

Para itens acionáveis dentro de um caderno: exercícios da lista, próximos passos, leituras pendentes. Cada tarefa pode ter prioridade e prazo. Tudo aparece também no calendário consolidado.

## 📅 Eventos — quando acontece

> Em breve

Lembretes com data: prova marcada, entrega do trabalho, aula de revisão. Eventos vivem dentro de cadernos mas se agregam num **calendário único** — um lugar pra ver "o que vem por aí".

---

## 🕸 Grafo de conhecimento

> Em breve

Tudo isso — notas, tarefas, eventos — convive num **grafo visual**. Os nós são as entidades; as arestas são as tags compartilhadas e os cadernos que as contêm.

Use o grafo pra descobrir conexões que você não percebeu — uma nota de cálculo ligada a uma de física, e a uma tarefa de programação, porque todas tocam em "derivadas".

---

## Por onde começar

- [ ] Continue pelas próximas notas deste tutorial
- [ ] Crie seu primeiro caderno real
- [ ] Adicione duas notas com uma [tag]({{tags}}) em comum
- [ ] Use [Ctrl+K]({{atalhos}}) pra navegar rapidamente entre tudo

Quando estiver confortável, pode ocultar este tutorial pelo menu **⋮** no card do caderno (e restaurar depois pelo Cmd+K).`,
  },
  {
    slug: "blocos",
    title: "✨ Tipos de blocos",
    tags: [tag("tutorial"), tag("blocos")],
    markdown: `# Tipos de blocos

Cada nota é uma sequência de blocos tipados. Você pode misturar quantos quiser.

## Texto

Parágrafos como este — escreva livremente. Suporta **negrito**, *itálico*, __sublinhado__, ~~tachado~~ e \`código inline\`.

## Listas

- Bullet item 1
- Bullet item 2
- Bullet item 3

1. Lista numerada
2. Útil para passos sequenciais
3. Ou prioridades

## Lista de tarefas

- [x] Criar conta no SurfBook
- [x] Abrir o tutorial
- [ ] Criar meu primeiro caderno
- [ ] Adicionar minha primeira nota

## Citação

> "Aprender é descobrir aquilo que você já sabe. Ensinar é lembrar aos outros que eles também sabem."

## Código

\`\`\`js
function hello(name) {
  return \`Olá, \${name}!\`;
}
\`\`\`

## Divisor

---

## Como adicionar

- Clique no botão **+ Adicionar bloco** no fim da nota
- Ou hover num bloco e clique no \`+\` que aparece à esquerda
- Ou pressione **\`/\`** num parágrafo vazio para abrir o menu rápido

> Existem outras formas de chegar lá pelo teclado — confira os [atalhos do teclado]({{atalhos}}).

Para conectar este conteúdo a outras notas, use [tags compartilhadas]({{tags}}) ou referências internas com \`[[\` em qualquer texto.`,
  },
  {
    slug: "atalhos",
    title: "⌨ Atalhos do teclado",
    tags: [tag("tutorial"), tag("atalhos")],
    markdown: `# Atalhos do teclado

Ser rápido importa. Estes são os atalhos universais.

## Globais

- **Ctrl+K** (ou ⌘K no Mac): abre a paleta de busca/comandos
- **Ctrl+S** (ou ⌘S): salva a nota atual

## Dentro do editor de nota

- **Enter** num parágrafo: cria novo parágrafo abaixo
- **Enter** num título: cria parágrafo abaixo (sai do modo título)
- **Enter** numa lista: cria novo item da lista
- **Backspace** num bloco vazio: remove e foca o anterior
- **Tab** num item de lista: indenta (cria sub-item)
- **Shift+Tab**: desfaz a indentação
- **\`/\`** num parágrafo vazio: abre menu de [tipos de bloco]({{blocos}})
- **\`[[\`** em qualquer texto: abre o picker de referência interna pra outra nota, caderno ou bloco

## Reordenar blocos

Cada bloco tem um ícone de \`⋮⋮\` no gutter à esquerda — segure e arraste para reordenar.

> Tente agora: arraste este parágrafo para cima ou para baixo.

Quando dominar os atalhos, volte pra [visão geral]({{intro}}) e veja como tudo se conecta — ou explore como [tags]({{tags}}) ligam notas entre cadernos.`,
  },
  {
    slug: "tags",
    title: "🏷 Organizando com tags",
    tags: [tag("tutorial"), tag("tags"), tag("organização")],
    markdown: `# Organizando com tags

Tags conectam notas que tratam do mesmo assunto, independente do caderno.

## Como funcionam

- Adicione tags na barra logo abaixo do título da nota
- Comece a digitar — se já existe, aparece em sugestões; se não, é criada
- Tags têm cores aleatórias na criação para distinção visual

## Por que importa

Você pode estudar **álgebra linear** em um caderno de matemática e em outro de machine learning. Se ambos tem a tag \`álgebra-linear\`, você consegue:

1. Buscar todas as notas com aquela tag (em breve no Cmd+K)
2. Ver conexões no grafo de conhecimento (em breve — veja a [visão geral]({{intro}}))
3. Filtrar listas pelo tópico

## Próximos passos

- [ ] Crie seu primeiro caderno real
- [ ] Adicione 2-3 notas com tags compartilhadas
- [ ] Use [Ctrl+K]({{atalhos}}) para navegar entre elas

> Quando estiver pronto, pode ocultar este tutorial pelo menu \`⋮\` na lista de cadernos. Você sempre pode trazer de volta via Cmd+K (em breve: comando "Restaurar tutorial").`,
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

    // O tutorial foi escrito numa ordem pedagógica. Pré-salva a preferência
    // de "ordem manual" (position) pro caderno-tutorial — usuário pode
    // mudar depois, mas a primeira impressão respeita a sequência.
    saveSort(tutorial.id, "position");

    // Pass 1: cria notas com markdown bruto (placeholders preservados como
    // texto). Captura cada id pra montar o mapa slug → noteId.
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

    // Pass 2: substitui placeholders + acrescenta nav prev/next no fim
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
  } catch (err) {
    // Não queremos que falha de seed quebre o login. Loga e segue.
    console.error("[seedTutorial]", err);
  }
}
