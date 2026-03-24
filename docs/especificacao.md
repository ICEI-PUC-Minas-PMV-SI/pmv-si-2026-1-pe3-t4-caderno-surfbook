# 3. DOCUMENTO DE ESPECIFICAÇÃO DE REQUISITOS DE SOFTWARE

## 3.1 Objetivos deste documento

Descrever e especificar os requisitos do sistema **SurfBook** — uma plataforma de suporte ao aprendizado centrada no estudante — considerando as necessidades identificadas no Eixo 1 (Aplicações Web) e propondo melhorias fundamentadas em heurísticas de design e princípios de Design Centrado no Usuário (DCU). Este documento evolui a especificação original para um nível de projeto master, incorporando análise heurística (Nielsen, 1994), princípios gestálticos e as 8 Regras de Ouro de Shneiderman.

## 3.2 Escopo do produto

### 3.2.1 Nome do produto e seus componentes principais

O produto é denominado **SurfBook — Sistema de Suporte ao Aprendizado**. Ele é composto pelos seguintes módulos:

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | **Autenticação** | Cadastro, login e gestão de sessão do usuário |
| 2 | **Cadernos** | Criação, edição, listagem e exclusão de cadernos (cursos/disciplinas) |
| 3 | **Conteúdos** | Gestão de conteúdos dentro dos cadernos, com editor de blocos rico |
| 4 | **Busca** | Motor de busca full-text com filtro por tipo, tags e data |
| 5 | **Calendário** | Visualização e gestão de eventos acadêmicos |
| 6 | **Tarefas** | Quadro Kanban de tarefas com hierarquia e prioridades |
| 7 | **Tags e Links** | Categorização por tags e ligação entre conteúdos |
| 8 | **Grafo de Conhecimento** | Visualização das conexões entre cadernos, conteúdos e tags |
| 9 | **Compartilhamento** | Partilha de cadernos entre usuários |

### 3.2.2 Missão do produto

Resgatar a experiência estruturada do caderno escolar em ambiente digital, permitindo que estudantes organizem, personifiquem e revisem seus estudos de forma autônoma e produtiva. O SurfBook centraliza a gestão acadêmica do aluno — conteúdos, tarefas, calendário e conexões de conhecimento — em uma interface única, acessível e intuitiva.

### 3.2.3 Limites do produto

- O SurfBook **não** substitui plataformas LMS institucionais (Canvas, Moodle, etc.) — ele complementa.
- O SurfBook **não** realiza avaliações, notas ou frequência de alunos.
- O SurfBook **não** oferece comunicação síncrona (chat, videoconferência).
- O SurfBook **não** integra com sistemas de pagamento ou matrícula.
- Nesta versão, a persistência é via localStorage do navegador (frontend-only), sem backend dedicado.

### 3.2.4 Benefícios do produto

| # | Benefício | Valor para o Usuário |
|---|-----------|---------------------|
| 1 | Centralização dos estudos em uma única plataforma | Essencial |
| 2 | Organização de conteúdos por cadernos, tags e links | Essencial |
| 3 | Editor de blocos para criação de anotações ricas | Essencial |
| 4 | Visualização do conhecimento em grafo interativo | Importante |
| 5 | Gestão de tarefas e prazos integrada aos conteúdos | Essencial |
| 6 | Calendário acadêmico com eventos auto-gerados | Importante |
| 7 | Busca inteligente com suporte a fuzzy matching | Importante |
| 8 | Compartilhamento de cadernos entre colegas | Desejável |
| 9 | Interface responsiva e mobile-first | Essencial |
| 10 | Acessibilidade para leitores de tela | Importante |

## 3.3 Descrição geral do produto

### 3.3.1 Requisitos Funcionais

Os requisitos abaixo evoluem os 15 requisitos originais do Eixo 1, incorporando melhorias identificadas por análise heurística.

| Código | Requisito Funcional | Descrição | Prioridade | Origem |
|--------|---------------------|-----------|------------|--------|
| RF-01 | Cadastrar conta | O sistema deve permitir o cadastro com nome, e-mail e senha, com validação de formato e confirmação de senha | ALTA | Eixo 1 |
| RF-02 | Autenticar usuário | O sistema deve permitir login com e-mail e senha, com feedback claro de erros (H9) | ALTA | Eixo 1 |
| RF-03 | Recuperar senha | O sistema deve oferecer fluxo de recuperação de senha por e-mail | MÉDIA | **Novo** |
| RF-04 | Gerenciar perfil | O sistema deve permitir edição de nome, e-mail e senha do usuário logado | MÉDIA | **Novo** |
| RF-05 | Criar caderno | O sistema deve permitir criação de cadernos com nome, descrição, ícone, imagem e data limite opcional | ALTA | Eixo 1 |
| RF-06 | Editar caderno | O sistema deve permitir edição de todos os campos do caderno | ALTA | Eixo 1 |
| RF-07 | Excluir caderno | O sistema deve permitir exclusão com confirmação explícita e possibilidade de desfazer (H3 — controle e liberdade do usuário) | ALTA | Eixo 1 |
| RF-08 | Listar cadernos | O sistema deve apresentar cadernos em grid com cards visuais, suportando ordenação e filtro | ALTA | Eixo 1 |
| RF-09 | Criar conteúdo | O sistema deve permitir criação de conteúdo dentro de um caderno, com nome, ícone, tags e data limite | ALTA | Eixo 1 |
| RF-10 | Editar conteúdo com editor de blocos | O sistema deve oferecer editor de blocos com: títulos, parágrafos, listas, checklists, imagens, links e bookmarks. Cada bloco deve ser reordenável por drag-and-drop | ALTA | Eixo 1 |
| RF-11 | Excluir conteúdo | O sistema deve permitir exclusão com confirmação e opção de desfazer | ALTA | Eixo 1 |
| RF-12 | Buscar conteúdos | O sistema deve oferecer busca full-text em cadernos, conteúdos e nós, com suporte a busca aproximada (fuzzy) e filtros por tipo | ALTA | Eixo 1 |
| RF-13 | Visualizar calendário | O sistema deve exibir calendário mensal/semanal/diário com eventos gerados automaticamente a partir de datas-limite de cadernos e conteúdos | MÉDIA | Eixo 1 |
| RF-14 | Gerenciar eventos | O sistema deve permitir criar, editar e excluir eventos no calendário, com nome, período, prioridade e vínculo a caderno/conteúdo | MÉDIA | Eixo 1 |
| RF-15 | Gerenciar tarefas | O sistema deve oferecer quadro de tarefas com colunas configuráveis, prioridades, datas-limite e hierarquia (subtarefas) | MÉDIA | Eixo 1 |
| RF-16 | Categorizar com tags | O sistema deve permitir criação de tags com nome e cor, associáveis a conteúdos para categorização | MÉDIA | Eixo 1 |
| RF-17 | Vincular conteúdos | O sistema deve permitir criar links entre conteúdos (via tags compartilhadas ou link direto), visíveis no editor e no grafo | ALTA | Eixo 1 |
| RF-18 | Visualizar grafo de conhecimento | O sistema deve apresentar visualização interativa (force-directed) das conexões entre cadernos, conteúdos e tags, com filtros de visibilidade | MÉDIA | Eixo 1 |
| RF-19 | Compartilhar cadernos | O sistema deve permitir gerar link de compartilhamento (somente leitura) de cadernos completos, com exportação em formato legível | BAIXA | Eixo 1 |
| RF-20 | Indicar status do sistema | O sistema deve fornecer feedback visual claro durante operações (salvar, excluir, buscar), com indicadores de carregamento e confirmações (H1 — visibilidade do status do sistema) | ALTA | **Novo** |
| RF-21 | Oferecer ações de desfazer | O sistema deve permitir desfazer ações destrutivas (exclusão de cadernos, conteúdos, tarefas) por meio de toast/snackbar com botão "Desfazer" (H3 — controle e liberdade do usuário) | ALTA | **Novo** |
| RF-22 | Prevenir erros | O sistema deve validar formulários em tempo real, desabilitar ações inválidas e apresentar diálogos de confirmação antes de ações irreversíveis (H5 — prevenção de erros) | ALTA | **Novo** |
| RF-23 | Exibir ajuda contextual | O sistema deve fornecer tooltips, placeholders descritivos e uma seção de ajuda/onboarding para novos usuários (H10 — ajuda e documentação) | BAIXA | **Novo** |
| RF-24 | Exportar conteúdo | O sistema deve permitir exportar cadernos e conteúdos em formato Markdown e JSON | BAIXA | **Novo** |
| RF-25 | Importar conteúdo | O sistema deve permitir importar cadernos a partir de arquivos JSON exportados previamente | BAIXA | **Novo** |
| RF-26 | Navegar com breadcrumbs | O sistema deve apresentar trilha de navegação (breadcrumbs) em todas as telas internas, permitindo retorno rápido a níveis anteriores (H3, H7 — flexibilidade e eficiência) | MÉDIA | **Novo** |
| RF-27 | Exibir histórico de alterações | O sistema deve registrar e exibir um log de alterações recentes em cadernos e conteúdos | BAIXA | Eixo 1 |

### 3.3.2 Requisitos Não Funcionais

| Código | Requisito Não Funcional | Heurística Relacionada | Prioridade |
|--------|-------------------------|----------------------|------------|
| RNF-01 | A aplicação deve ser publicada em URL pública na internet | — | ALTA |
| RNF-02 | A aplicação deve ser responsiva (mobile-first), otimizada para telas a partir de 360px e escalonável até desktops | H8 — Design estético e minimalista | ALTA |
| RNF-03 | A aplicação deve ser acessível conforme WCAG 2.1 nível AA (contraste mínimo 4.5:1, navegação por teclado, atributos ARIA) | H4 — Consistência e padrões | ALTA |
| RNF-04 | A aplicação deve ser compatível com as últimas versões de Chrome, Edge e Firefox | — | MÉDIA |
| RNF-05 | O tempo de resposta para interações do usuário deve ser inferior a 500ms | H1 — Visibilidade do status | ALTA |
| RNF-06 | A interface deve seguir padrões visuais consistentes (tipografia Poppins, paleta de cores definida, iconografia Bootstrap Icons) | H4 — Consistência e padrões | ALTA |
| RNF-07 | Tecnologias: HTML5, CSS3, JavaScript (ES6+). Sem dependência de frameworks pesados | — | ALTA |
| RNF-08 | A aplicação deve funcionar offline após o primeiro carregamento (Service Worker/cache) | — | BAIXA |
| RNF-09 | Os dados do usuário devem ser isolados por conta (sem vazamento entre sessões) | — | ALTA |
| RNF-10 | A interface deve apresentar linguagem familiar ao contexto acadêmico (cadernos, conteúdos, tarefas) em vez de termos técnicos | H2 — Correspondência com o mundo real | MÉDIA |
| RNF-11 | Mensagens de erro devem ser claras, indicar o problema e sugerir solução | H9 — Ajudar a reconhecer, diagnosticar e recuperar erros | ALTA |
| RNF-12 | Elementos interativos devem ter estados visíveis (hover, focus, active, disabled) | H1, H4 | MÉDIA |

### 3.3.3 Usuários

| Ator | Descrição |
|------|-----------|
| Estudante | Usuário principal da plataforma. Aluno de graduação, pós-graduação ou autodidata que utiliza o SurfBook para organizar seus estudos, criar anotações, gerenciar tarefas e revisar conteúdos. Possui acesso completo a todas as funcionalidades do sistema. |
| Visitante (compartilhamento) | Usuário que acessa um caderno compartilhado via link público. Possui acesso somente leitura ao conteúdo compartilhado, sem necessidade de conta. |
| Administrador | Usuário com permissões elevadas para gerenciar contas de usuários e dados do sistema. Pode impersonar outros usuários para suporte técnico. |

## 3.4 Modelagem do Sistema

### 3.4.1 Diagrama de Casos de Uso

O diagrama a seguir representa os principais casos de uso do SurfBook, organizados por ator.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           SurfBook                                  │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │  Cadastrar Conta │    │  Autenticar      │                       │
│  │      (CSU01)     │    │    (CSU02)       │                       │
│  └────────┬─────────┘    └────────┬─────────┘                       │
│           │                       │                                  │
│  ┌────────┴─────────┐    ┌───────┴──────────┐                       │
│  │  Gerenciar Perfil│    │ Recuperar Senha  │                       │
│  │     (CSU03)      │    │    (CSU04)       │                       │
│  └──────────────────┘    └──────────────────┘                       │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │Gerenciar Cadernos│    │Gerenciar Conteúdo│    │ Editar Blocos  │ │
│  │     (CSU05)      │◄───│     (CSU06)      │◄───│   (CSU07)     │ │
│  └──────────────────┘    └────────┬─────────┘    └────────────────┘ │
│                                   │                                  │
│                          ┌────────┴─────────┐                       │
│                          │ Categorizar Tags  │                       │
│                          │    (CSU08)        │                       │
│                          └──────────────────┘                        │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │  Buscar Conteúdo │    │Gerenciar Tarefas │    │ Gerenciar      │ │
│  │     (CSU09)      │    │    (CSU10)       │    │ Calendário     │ │
│  └──────────────────┘    └──────────────────┘    │   (CSU11)      │ │
│                                                   └────────────────┘ │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │  Visualizar Grafo│    │  Compartilhar    │                       │
│  │     (CSU12)      │    │  Caderno (CSU13) │                       │
│  └──────────────────┘    └──────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

    Atores:
    ┌─────────┐    → CSU01–CSU13
    │Estudante│
    └─────────┘

    ┌──────────┐   → Visualizar caderno compartilhado (somente leitura)
    │Visitante │
    └──────────┘

    ┌──────────────┐  → CSU01–CSU13 + Gerenciar Usuários + Impersonar
    │Administrador │
    └──────────────┘
```

### 3.4.2 Descrições de Casos de Uso

---

#### Gerenciar Cadernos (CSU05)

**Sumário:** O Estudante realiza a gestão (inclusão, edição, exclusão e listagem) de cadernos.

**Ator Primário:** Estudante.

**Pré-condições:** O Estudante deve estar autenticado no sistema.

**Fluxo Principal:**

1) O Estudante acessa a tela de cadernos.
2) O Sistema exibe a lista de cadernos do usuário em formato de cards, com nome, ícone, imagem e opções de ação.
3) O Estudante seleciona a operação desejada: Criar, Editar, Excluir ou Acessar.
4) O caso de uso prossegue conforme o fluxo alternativo correspondente.

**Fluxo Alternativo (3): Criar Caderno**

a) O Estudante clica no botão "Adicionar". <br>
b) O Sistema exibe modal com campos: nome (obrigatório), descrição, ícone, imagem e data limite. <br>
c) O Estudante preenche os campos. O Sistema valida em tempo real — campos obrigatórios são destacados, botão "Salvar" permanece desabilitado até a validação passar (**H5 — prevenção de erros**). <br>
d) O Estudante confirma a criação. <br>
e) O Sistema salva o caderno, exibe toast de confirmação (**H1 — visibilidade do status**) e atualiza a lista. Se houver data limite, cria automaticamente um evento no calendário e uma tarefa associada. <br>

**Fluxo Alternativo (3): Editar Caderno**

a) O Estudante clica no ícone de edição do card. <br>
b) O Sistema exibe modal preenchido com os dados atuais do caderno. <br>
c) O Estudante altera os campos desejados. <br>
d) O Sistema valida e salva as alterações, exibindo confirmação. <br>

**Fluxo Alternativo (3): Excluir Caderno**

a) O Estudante clica no ícone de exclusão do card. <br>
b) O Sistema exibe diálogo de confirmação informando que a exclusão removerá todos os conteúdos, tarefas e eventos associados (**H5 — prevenção de erros**). <br>
c) O Estudante confirma a exclusão. <br>
d) O Sistema remove o caderno e exibe toast com opção "Desfazer" por 8 segundos (**H3 — controle e liberdade do usuário**). <br>

**Fluxo Alternativo (3): Acessar Caderno**

a) O Estudante clica no card do caderno. <br>
b) O Sistema navega para a tela de detalhe do caderno, exibindo breadcrumb "Home > Cadernos > [Nome]" (**H7 — flexibilidade e eficiência**) e listando os conteúdos do caderno. <br>

**Pós-condições:** O caderno foi criado, editado, excluído ou acessado. O índice de busca foi atualizado.

---

#### Gerenciar Conteúdo (CSU06)

**Sumário:** O Estudante gerencia conteúdos dentro de um caderno.

**Ator Primário:** Estudante.

**Pré-condições:** O Estudante deve estar autenticado e ter acessado um caderno (CSU05).

**Fluxo Principal:**

1) O Sistema exibe a lista de conteúdos do caderno selecionado, com cards mostrando nome, ícone e tags.
2) O Estudante seleciona: Criar, Editar, Excluir ou Acessar conteúdo.

**Fluxo Alternativo: Criar Conteúdo**

a) O Estudante clica em "Adicionar". <br>
b) O Sistema exibe modal com campos: nome (obrigatório), ícone, tags e data limite. <br>
c) Para tags, o Estudante digita o nome e seleciona uma cor. Tags existentes são sugeridas pelo sistema (**H6 — reconhecimento em vez de memorização**). <br>
d) O Estudante confirma. O Sistema salva e redireciona para o editor de blocos. <br>

**Fluxo Alternativo: Acessar Conteúdo**

a) O Estudante clica no card do conteúdo. <br>
b) O Sistema navega para o editor de blocos (CSU07), exibindo breadcrumb "Home > Cadernos > [Caderno] > [Conteúdo]". <br>

**Pós-condições:** O conteúdo foi criado, editado, excluído ou acessado.

---

#### Editar Blocos de Conteúdo (CSU07)

**Sumário:** O Estudante edita o conteúdo de uma anotação usando um editor de blocos.

**Ator Primário:** Estudante.

**Pré-condições:** O Estudante acessou um conteúdo (CSU06).

**Fluxo Principal:**

1) O Sistema exibe o editor com os blocos existentes do conteúdo. Cada bloco tem tipo (título, parágrafo, lista, checklist, imagem, link) e pode ser editado inline.
2) O Estudante edita o texto de um bloco diretamente.
3) O Sistema salva automaticamente após cada alteração, indicando "Salvo" no canto da tela (**H1 — visibilidade do status**).

**Fluxo Alternativo: Adicionar Bloco**

a) O Estudante clica no botão "+" entre blocos ou no final da página. <br>
b) O Sistema exibe toolbar com os tipos disponíveis: Título (H1), Parágrafo, Lista Ordenada, Lista Não-Ordenada, Checklist, Imagem, Bookmark/Link. <br>
c) O Estudante seleciona o tipo. O Sistema insere um bloco vazio na posição indicada. <br>

**Fluxo Alternativo: Reordenar Blocos**

a) O Estudante arrasta um bloco usando o handle de drag-and-drop. <br>
b) O Sistema reposiciona o bloco e atualiza a ordem. <br>

**Fluxo Alternativo: Excluir Bloco**

a) O Estudante clica no botão de exclusão do bloco. <br>
b) O bloco é removido com opção "Desfazer" via toast. <br>

**Pós-condições:** Os blocos foram alterados e persistidos automaticamente.

---

#### Buscar Conteúdo (CSU09)

**Sumário:** O Estudante busca cadernos, conteúdos ou nós de conteúdo por termos.

**Ator Primário:** Estudante.

**Pré-condições:** O Estudante está autenticado.

**Fluxo Principal:**

1) O Estudante digita termos no campo de busca presente no cabeçalho (disponível em todas as telas).
2) O Sistema exibe resultados em dropdown em tempo real, categorizados por tipo (caderno, conteúdo, nó) com badges visuais (**H6 — reconhecimento em vez de memorização**).
3) O Estudante clica em um resultado.
4) O Sistema navega para o item selecionado.

**Fluxo Alternativo: Busca sem resultados**

a) O Sistema exibe mensagem "Nenhum resultado encontrado" com sugestões: verificar ortografia ou tentar termos mais gerais (**H9 — ajudar a recuperar de erros**). <br>

**Pós-condições:** O Estudante foi direcionado ao conteúdo buscado ou informado da ausência de resultados.

---

#### Gerenciar Tarefas (CSU10)

**Sumário:** O Estudante gerencia tarefas em um quadro Kanban.

**Ator Primário:** Estudante.

**Pré-condições:** O Estudante está autenticado.

**Fluxo Principal:**

1) O Estudante acessa a tela de tarefas pelo menu lateral.
2) O Sistema exibe o quadro de tarefas com colunas (ex: A Fazer, Em Progresso, Concluído). Tarefas mostram título, prioridade (cor), data limite e vínculo com caderno/conteúdo.
3) O Estudante pode criar, editar, concluir, excluir ou reordenar tarefas.

**Fluxo Alternativo: Criar Tarefa**

a) O Estudante clica em "Adicionar Tarefa" em uma coluna. <br>
b) O Sistema exibe formulário com: título, descrição, prioridade (alta/média/baixa), data limite e vínculo opcional a caderno/conteúdo. <br>
c) O Estudante preenche e confirma. <br>

**Fluxo Alternativo: Criar Subtarefa**

a) O Estudante expande uma tarefa e clica em "Adicionar Subtarefa". <br>
b) O Sistema cria uma tarefa filha vinculada à tarefa pai. <br>

**Pós-condições:** As tarefas foram gerenciadas e o calendário atualizado conforme datas-limite.

---

#### Visualizar Grafo de Conhecimento (CSU12)

**Sumário:** O Estudante visualiza as conexões entre seus cadernos, conteúdos e tags em um grafo interativo.

**Ator Primário:** Estudante.

**Pré-condições:** O Estudante está autenticado e possui conteúdos com tags cadastradas.

**Fluxo Principal:**

1) O Estudante acessa a tela de Grafo pelo menu lateral.
2) O Sistema renderiza um grafo force-directed com nós coloridos por tipo (cadernos, conteúdos, tags) e arestas representando as conexões.
3) O Estudante interage com o grafo: zoom, drag de nós, filtros de visibilidade.

**Fluxo Alternativo: Filtrar Visualização**

a) O Estudante utiliza os controles de filtro para exibir/ocultar cadernos, conteúdos ou tags. <br>
b) O Sistema atualiza o grafo em tempo real, mantendo a posição dos nós visíveis (**H4 — consistência**). <br>

**Fluxo Alternativo: Acessar Item pelo Grafo**

a) O Estudante clica em um nó do grafo. <br>
b) O Sistema exibe um painel lateral com detalhes do item e link para navegação direta. <br>

**Pós-condições:** O Estudante visualizou as conexões de seu conhecimento.

---

#### Compartilhar Caderno (CSU13)

**Sumário:** O Estudante gera um link de compartilhamento de um caderno.

**Ator Primário:** Estudante.

**Ator Secundário:** Visitante.

**Pré-condições:** O Estudante está autenticado e possui pelo menos um caderno.

**Fluxo Principal:**

1) O Estudante acessa as opções de um caderno e seleciona "Compartilhar".
2) O Sistema gera um link público (base64 encoded) contendo os dados do caderno, conteúdos e nós.
3) O Sistema exibe o link com botão "Copiar" (**H7 — flexibilidade e eficiência**).
4) O Visitante acessa o link.
5) O Sistema exibe o caderno em modo somente leitura, sem necessidade de autenticação.

**Pós-condições:** O caderno foi compartilhado via link público.

---

### 3.4.3 Diagrama de Classes

O diagrama a seguir representa o modelo de domínio do SurfBook, baseado na implementação do Eixo 1 com melhorias propostas.

```
┌─────────────────────┐       ┌──────────────────────┐
│        User         │       │      Notebook         │
├─────────────────────┤       ├──────────────────────┤
│ id: string          │ 1   * │ id: string            │
│ name: string        │───────│ name: string          │
│ fullName: string    │       │ description: string   │
│ email: string       │       │ icon: string          │
│ password: string    │       │ image: string         │
│ role: enum          │       │ due_date: Date?       │
│ createdAt: Date     │       │ createdAt: Date       │
│ updatedAt: Date     │       │ updatedAt: Date       │
└─────────────────────┘       └──────────┬───────────┘
                                         │ 1
                                         │
                                         │ *
                              ┌──────────┴───────────┐
                              │   ContentMetadata     │
                              ├──────────────────────┤
                              │ id: string            │
                              │ name: string          │
                              │ description: string   │
                              │ icon: string          │
                              │ notebook_id: string   │
                              │ content_id: string    │
                              │ due_date: Date?       │
                              │ createdAt: Date       │
                              │ updatedAt: Date       │
                              └──────┬──────┬────────┘
                                     │ 1    │ *
                                     │      │
                                * ┌──┘      └──┐ *
                    ┌─────────────┴──┐   ┌─────┴────────────┐
                    │  ContentNode    │   │      Tag          │
                    ├────────────────┤   ├──────────────────┤
                    │ id: string     │   │ name: string      │
                    │ type: enum     │   │ color: string     │
                    │ value: string  │   └──────────────────┘
                    │ position: int  │          │ *
                    │ notebook_id    │          │
                    │ content_id     │          │ (conecta conteúdos
                    │ customStyle[]  │          │  que compartilham
                    └────────────────┘          │  a mesma tag)
                                               │
                              ┌─────────────────┘
                              │
┌─────────────────────┐       │       ┌──────────────────────┐
│       Task          │       │       │       Event           │
├─────────────────────┤       │       ├──────────────────────┤
│ id: string          │       │       │ id: string            │
│ title: string       │       │       │ name: string          │
│ description: string │       │       │ description: string   │
│ priority: enum      │       │       │ all_day: boolean      │
│ due_date: Date      │       │       │ start_date: Date      │
│ completed_at: Date? │       │       │ end_date: Date        │
│ level: int          │       │       │ priority: enum        │
│ parent_id: string?  │       │       │ owner: string         │
│ parent_type: enum   │       │       │ guests: string[]      │
│ parent_location: obj│       │       │ parent_location: obj  │
│ created_at: Date    │       │       │ parent_type: enum     │
│ updated_at: Date    │       │       │ created_at: Date      │
└─────────────────────┘       │       │ updated_at: Date      │
                              │       └──────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  SearchIndexItem    │
                    ├────────────────────┤
                    │ type: enum         │
                    │ label: string      │
                    │ localization: obj  │
                    │ terms: string[]    │
                    └────────────────────┘
```

**Tipos Enumerados:**
- `User.role`: `user` | `admin`
- `ContentNode.type`: `h1` | `paragraph` | `ordered_list` | `unordered_list` | `ordered_action_list` | `unordered_action_list` | `image` | `bookmark`
- `Task.priority` / `Event.priority`: `high` | `media` | `low`
- `Task.parent_type` / `Event.parent_type`: `notebook` | `content`
- `SearchIndexItem.type`: `notebook` | `content-meta` | `content-node`

### 3.4.4 Descrições das Classes

| # | Nome | Descrição |
|---|------|-----------|
| 1 | **User** | Representa o usuário do sistema. Armazena credenciais de autenticação, dados pessoais e papel (estudante ou administrador). Cada usuário possui seus próprios cadernos, tarefas e eventos isolados. |
| 2 | **Notebook** | Representa um caderno (curso ou disciplina). É o contêiner raiz que agrupa conteúdos relacionados. Possui metadados visuais (ícone, imagem) e uma data limite opcional que gera eventos e tarefas automaticamente. |
| 3 | **ContentMetadata** | Representa os metadados de um conteúdo dentro de um caderno. Contém nome, descrição, ícone e tags de categorização. Pertence a exatamente um Notebook. O conteúdo editável real é composto por ContentNodes. |
| 4 | **ContentNode** | Representa um bloco individual do editor de conteúdo. Cada nó tem um tipo (título, parágrafo, lista, imagem, etc.), um valor (texto ou dados), uma posição ordinal e estilos customizados. Pertence a um ContentMetadata específico. |
| 5 | **Tag** | Representa uma etiqueta de categorização com nome e cor. Tags são associadas a ContentMetadata e servem como mecanismo de vinculação entre conteúdos — dois conteúdos com a mesma tag são considerados conectados no grafo de conhecimento. |
| 6 | **Task** | Representa uma tarefa do estudante. Suporta hierarquia (subtarefas via parent_id), prioridades e datas-limite. Pode ser vinculada a um caderno ou conteúdo específico via parent_location. Tarefas são auto-geradas quando cadernos ou conteúdos possuem data limite. |
| 7 | **Event** | Representa um evento no calendário acadêmico. Possui período (início/fim), suporte a dia inteiro, prioridade e lista de convidados. Vincula-se a cadernos ou conteúdos via parent_location. Eventos são auto-gerados a partir de datas-limite. |
| 8 | **SearchIndexItem** | Representa uma entrada no índice de busca. Contém o tipo do item indexado, um rótulo para exibição, a localização do item (IDs de caderno/conteúdo/nó) e os termos extraídos para correspondência. Utiliza Bloom Filter para busca rápida e Levenshtein para busca aproximada. |

## 3.5 Melhorias Propostas por Heurística de Design

A tabela abaixo consolida as principais melhorias identificadas pela aplicação das 10 Heurísticas de Nielsen ao sistema existente (Eixo 1), indicando o requisito funcional ou não funcional correspondente.

| Heurística | Problema Identificado (Eixo 1) | Melhoria Proposta | RF/RNF |
|------------|-------------------------------|-------------------|--------|
| **H1 — Visibilidade do status do sistema** | Operações de salvar, excluir e buscar não fornecem feedback visual ao usuário | Adicionar indicadores de loading, toasts de confirmação e auto-save visível no editor | RF-20, RNF-05 |
| **H2 — Correspondência com o mundo real** | Alguns termos técnicos na interface (ex: "nodes", "metadata") | Usar linguagem do domínio acadêmico: "cadernos", "conteúdos", "anotações" | RNF-10 |
| **H3 — Controle e liberdade do usuário** | Exclusões são permanentes e imediatas, sem possibilidade de desfazer | Implementar "Desfazer" via toast/snackbar em todas as ações destrutivas | RF-07, RF-11, RF-21 |
| **H4 — Consistência e padrões** | Variações no estilo de modais, botões e cards entre diferentes telas | Padronizar componentes visuais com design system consistente (tipografia, cores, espaçamentos) | RNF-06, RNF-12 |
| **H5 — Prevenção de erros** | Formulários permitem submissão com dados incompletos ou inválidos | Validação em tempo real, botões desabilitados até campos válidos, confirmação em ações críticas | RF-22 |
| **H6 — Reconhecimento em vez de memorização** | Busca não categoriza resultados por tipo; tags precisam ser digitadas manualmente | Badges de tipo nos resultados de busca; sugestão automática de tags existentes | RF-12, RF-16 |
| **H7 — Flexibilidade e eficiência de uso** | Navegação exige múltiplos cliques para voltar a telas anteriores | Breadcrumbs em todas as telas; atalhos de teclado para ações frequentes | RF-26 |
| **H8 — Design estético e minimalista** | Algumas telas apresentam excesso de informação visual | Simplificar layout, priorizar conteúdo, reduzir ruído visual | RNF-02 |
| **H9 — Ajudar a reconhecer e recuperar de erros** | Mensagens de erro genéricas (alerts JavaScript) | Mensagens contextuais com indicação do problema e sugestão de ação | RNF-11 |
| **H10 — Ajuda e documentação** | Não há sistema de onboarding ou ajuda contextual | Tooltips em elementos-chave, tour guiado no primeiro acesso, seção de ajuda | RF-23 |
