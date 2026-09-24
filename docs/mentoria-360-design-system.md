# Mentoria 360° × Design System — estado e lacunas

Registro da passagem da Mentoria 360° pelo design system `@upvox-dev/ui`
(v0.3.0). Esta rodada cobriu **o dashboard "Minha Empresa" do aluno**
(`/course/mentoria`), a navegação da área e a **coluna do Assistente
Empresarial** (casca de UI; a conversa ainda não tem backend — ver B). O
restante das telas está listado em "Próximas rodadas".

---

## A. Lacunas do `@upvox-dev/ui`

O DS publica 14 componentes: `Avatar, Badge, Button, Card, Checkbox,
FileUpload, FormField, Input, Modal, Radio, Select, Switch, Table, Textarea`.
Nenhum deles é de layout ou de dados.

### A.1 Componentes construídos localmente (candidatos a subir para o DS)

Vivem em `src/modules/mentoria/components/ui/index.tsx`, escritos em DOM +
classes de token — o mesmo padrão de `src/app/mentoria-admin/_components/ui.tsx`.
Ficam em `src/modules/` justamente porque não pertencem a uma rota: são peças
de biblioteca sem biblioteca.

| Peça | O que é | Onde o desenho pede |
|---|---|---|
| `SectionCard` | Card com título, descrição e slot de ação no canto | Todos os blocos do dashboard |
| `StatCard` + `DeltaPill` | KPI de topo: rótulo, valor, meta, chip de ícone e pílula de variação | Linha "Resumo do período" |
| `SegmentedControl` | Alternador 3m / 6m / 12m | Canto do "Resumo do período" |
| `DonutProgress` | Anel SVG com percentual no centro | "Progresso da Jornada" |
| `StatLine` | Linha rótulo → valor | Breakdown do donut |
| `ListRow` + `RowIndex` | Linha com índice/data, título e badge | "Prioridades Atuais", "Próximas Ações" e os atalhos do Assistente |
| `AssistantPanel` | Coluna de chat: cabeçalho, card de boas-vindas, atalhos e composer que cresce com o texto | Coluna do Assistente |
| `LiveChatView` | Chat de transmissão: cabeçalho, linha de mensagem com avatar + autor + corpo, empty state e composer de uma linha | Coluna do detalhe da live |
| `LivePlayer` | Moldura de vídeo `aspect-video` com badge sobreposto | Detalhe da live |

**Aviso de versão** (levantado na rodada das Lives): o `@upvox-dev/ui`
**instalado** publica 14 componentes, mas o fonte em `upvox-ui`
(`packages/ui/src/components`) já tem **32** — e os dois dizem `0.3.0`. Já
existem lá `EmptyState`, `ListRow`, `SectionCard`, `StatCard`,
`SegmentedControl`, `DonutProgress`, `StatLine`, `Skeleton`, `ProgressBar`,
`Timeline`, `Callout`, `PageHeader`, `SemaphoreBadge`, `ScaleRating`,
`LineChart`, `RadarChart`, `ActionCheckButton`. Ou seja: metade da tabela acima
**não precisa mais ser construída, precisa ser publicada**. Antes de planejar
qualquer peça nova, conferir `node_modules/@upvox-dev/ui/src/components` — a
versão do `package.json` não distingue as duas.

### A.2 Outros vãos do catálogo

Sem uso nesta rodada, mas já sentidos nas telas seguintes: **Tabs**,
**Sidebar/Nav**, **PageHeader/Shell**, **Progress bar**, **Tooltip**,
**Toast**, **Dropdown/Menu**, **Skeleton**, **Pagination**, **charts**.
Localmente supridos por `recharts` (gráficos) e `sonner` (toasts).

O Assistente somou outro vão: **nada de chat**. Não há composer que cresça com o
conteúdo, bolha de mensagem, estado de "digitando" nem painel lateral. O app já
tem quatro superfícies de chat (`live-chat`, `tool-agent-chat`,
`support-chat-widget`, `doubt-chat-view`), cada uma com o seu — é candidato
forte a virar componente do DS. A rodada das Lives reforçou: o `LiveChatView`
saiu praticamente idêntico ao `AssistantPanel` da cintura para baixo, e as duas
implementações agora divergem só no composer (uma linha × cresce com o texto).

As Lives somaram outros dois: **moldura de vídeo** (`aspect-video` + borda +
badge sobreposto, hoje replicada entre `live-player` e o player de aulas) e
**cabeçalho de grupo de lista** (ícone + rótulo em caixa alta + nota),
reescrito à mão em toda tela que agrupa itens por status.

### A.3 Tokens de modo escuro ausentes

O DS foi extraído do Figma **só em modo claro**. O app boota escuro, e
`src/app/globals.css` redefine as variáveis sob `.dark`. Três tokens não têm
como ser corrigidos ali:

- `text-brand`, `text-success`, `text-danger` — o mesmo token serve de **fundo**
  no botão primário e no badge, onde precisa continuar `#7c3aed` / `#10b981` /
  `#dc2626`. Como cor de **texto** sobre fundo preto, é ilegível.
  → Por isso sobrevive o par `dark:` em pontos específicos (`text-brand
  dark:text-violet-400`), sempre com comentário no ponto.
- `brand-wash` tem versão escura no Figma (`#441a81`) que **nunca foi extraída**
  para `tokens.json`.

**Pedido ao DS**: publicar tons semânticos de *texto* separados dos de *fundo*
(`text-on-surface-brand` e afins), e extrair o modo escuro que já existe no
Figma.

### A.4 Cores lidas por JS ficam congeladas no claro

`ActivityIndicator`, `placeholderTextColor` e afins não aceitam `className` — o
DS lê o hex de `tokens.json`, que é claro. O mesmo vale para o `recharts`:
`stroke` não aceita `className`, então `src/app/course/(shell)/mentoria/page.tsx`
duplica os valores dos tokens em `SERIES_COLORS`. Se o DS exportasse os tokens
resolvidos por tema em JS, essa duplicação sumiria.

### A.5 Atritos de API do DS

- **`Button`/`Badge` só embrulham `children` string em `<Text>`.** Ícone + texto
  vira um array, o array bypassa o wrap e o texto cru quebra em runtime
  ("A text node cannot be a child of a `<View>`"). O contorno é importar
  `buttonLabel` e escrever o `<Text>` à mão — está em `mentoria-nav-card.tsx` e
  nas telas do admin. Seria melhor o `Button` embrulhar qualquer nó de texto.
- **`Select` é só o gatilho** — sem `options`, sem seleção controlada. O menu é
  responsabilidade do app.
- **`Modal` não rola.** Formulários altos estouram a viewport; por isso o admin
  mantém um `Modal` local e o `CompanyForm` desta tela virou seção sob demanda
  em vez de modal.
- **`Table` não faz scroll horizontal sozinho** — precisa de wrapper
  `overflow-x-auto`.
- **`Input` e `Textarea` não servem um composer de chat.** O `Input` é de uma
  linha e não expõe `onSubmitEditing` no topo (só por dentro de `inputProps`,
  junto com `maxLength` — foi o caminho usado no `live-chat-view.tsx`, e
  funciona, mas o envio pelo Enter ficar enterrado num objeto de props é
  exatamente o tipo de coisa que se descobre lendo o `.types.ts`); o
  `Textarea` tem altura fixa por `size`, com `multiline` embutido e *excluído* de
  `inputProps`. Nenhum dos dois cresce com o conteúdo, que é o mínimo de um
  campo de mensagem — daí o `<textarea>` cru vestido de tokens no
  `assistant-panel.tsx`.
- **`Button` não tem variante circular.** `rounded-control` é fixo no
  `buttonContainer`. Como o `cn` do DS é `tailwind-merge`, dá para sobrescrever
  por `className` (`h-9 w-9 rounded-full px-0`), mas é contorno, não API.
- **`Button` não encaminha `ref` nem props ARIA arbitrárias.** Não dá para pôr
  `aria-expanded`/`aria-haspopup` num gatilho de painel, nem devolver foco a ele
  programaticamente — a única saída é embrulhar num elemento próprio e procurar
  o `[role="button"]` que o react-native-web imprime.
- **Ícone dentro de `Button` não herda a cor do rótulo.** O `buttonLabel` veste
  só o `<Text>`; um `lucide` ao lado fica com a cor herdada do pai. A cor tem de
  ir explícita em cada ícone.

**Levantados na rodada do Diagnóstico** — todos vieram do mesmo lugar: um
formulário *data-driven* precisa de um componente por tipo de campo, e é aí que
o catálogo mostra o fundo. O `dynamic-form.tsx` acabou quase todo em elemento
nativo tokenizado, com o motivo comentado em cada ramo.

- **`Input type="currency"` mascara e devolve `string`.** O valor sai
  `"1.234,56"`, mas o formulário grava `Number` e o `metric_key` do snapshot
  depende disso — adotar mudaria o payload da API. E `type="numeric"` só aceita
  dígitos (`onlyDigits`), o que quebraria decimais e negativos. Falta um modo
  numérico cru, e falta `step`.
- **`Input type="date"` força o calendário próprio.** Não é um
  `<input type="date">`: é um `Pressable` que abre o `Modal` do DS (o mesmo que
  não rola). Sem fallback para o seletor nativo do browser, adotar seria trocar
  a interação, não a pintura.
- **`Textarea` não expõe `id`.** Só `accessibilityLabel`. Sem `id` não há
  `htmlFor`, então o rótulo não foca o campo no clique — e ligar rótulo e
  controle era justamente o defeito que a rodada foi corrigir. Ficou
  `<textarea>` nativo; bônus, o `dynamic-form` seguiu sem carregar a camada
  React Native, que ele injetaria no preview do form-builder do admin.
- **`FormField` não tem slot de ação no rótulo.** Ele renderiza `<View>`/`<Text>`
  do RN (não um `<label>` de verdade) e empilha rótulo em cima do campo. Aqui o
  rótulo divide a linha com a pílula "A LEVANTAR", que ficaria sem lugar.
- **Sem toggle binário e sem escala.** Não há Sim/Não nem 0–10. O `Radio` do DS
  não se desmarca, e o `SegmentedControl` local foi desenhado para 2–4 opções —
  11 segmentos numa coluna estreita ficariam menores que os quadrados atuais.

---

## B. Lacunas de API / rotas

O desenho aprovado mostra dados que o contrato atual da `upvox-api` não expõe.
Onde faltou, a tela foi alimentada com o dado real equivalente — nada de mock.

| Desenho | Situação | O que foi feito | O que falta |
|---|---|---|---|
| KPIs de topo: Faturamento Total, Ticket Médio, Clientes Ativos, Margem Líquida | Não existem como campos. `MntKpi` é genérico (nome, unidade livre, meta, direção) | Os 4 primeiros KPIs **ativos** da jornada viram os cards | Endpoint de resumo financeiro da jornada, ou KPIs canônicos com `key` conhecida |
| Variação "+5,8% vs mês anterior" | Não vem pronta | Calculada no cliente a partir das **duas últimas medições** de `/kpi/:id/history` | `delta` e `delta_pct` por período no próprio KPI — hoje são N chamadas de histórico para montar 4 cards |
| Série temporal por período (3m/6m/12m) | Histórico vem inteiro | Filtrado e agrupado por mês no cliente (`buildSeries`) | Parâmetro de período/granularidade no endpoint de histórico |
| Bloco "Prioridades Atuais" | Não existe. `MntGoal` **não tem** `priority` | Derivado das **tarefas abertas** ordenadas por `priority` + vencimento | `priority` em `MntGoal`, ou um conceito próprio de prioridade da jornada |
| Breakdown do donut (Encontros/Ferramentas/Tarefas/Indicadores) | Não vem agregado | Contado no cliente a partir de 4 queries já existentes | Contadores agregados no `bootstrap` — hoje o dashboard dispara 6 requisições |
| Rotas "Metas", "Relatórios", "Configuração" na barra lateral | **Não existem** | Omitidas da navegação — link morto é pior que ausência | Definir se viram rotas próprias ou seções de `desenvolvimento`/`evolucao` |
| Assistente Empresarial | **UI pronta, backend inexistente.** Não há endpoint conversacional para a Mentoria | Coluna com boas-vindas, atalhos e composer; enviar anuncia "em breve" via toast. Nenhuma resposta simulada | Endpoint multi-turno com streaming, e persistência de conversa. Ver nota abaixo |
| "Sujeito aos Termos" no aviso do Assistente | **Não existe rota de termos** no app (`find`/`grep` vazios) | Renderizado como texto puro, sem link | Criar a página de termos e ligar o link |

### Nota — o que já existe para o backend do Assistente

Nada disso foi usado nesta rodada (que é só front), mas evita começar do zero:

- **Aterramento já pronto**: `POST /v1/ai-knowledge/search` na `upvox-api` é
  `requireAuth` e o próprio comentário da rota diz que foi feito para a IA do
  chat chamar repassando o Bearer do aluno.
- **Precedente de streaming**: `POST /api/tool-agent/turn` (no gateway) já
  responde em SSE, e o front já sabe consumir — `streamAgentTurn` em
  `src/modules/tools/services/tool-agent.service.ts` (async generator sobre
  `res.body.getReader()`, porque `EventSource` é GET-only) mais
  `use-tool-agent.ts`, que tem sessão, histórico, `AbortController` e trava de
  reentrância. É o molde das bolhas quando a hora chegar.
- **O que falta mesmo**: `openrouterChat` (`upvox-api/src/lib/openrouter.ts`) é
  single-turn (um system + um user, sem `messages[]`) e **não streama**; e não há
  nenhuma tabela de conversa/mensagem para a IA. Os dois são trabalho novo.

### Nota — revisão de conteúdo do Diagnóstico (levantada, adiada)

A rodada do Diagnóstico foi **só de design system, por decisão explícita**:
nenhuma mudança de conteúdo, de obrigatoriedade ou de backend. O levantamento
abaixo ficou pronto e não foi aplicado — é a pauta de uma rodada própria.

O template vive num seed SQL versionado
(`upvox-api/supabase/migrations/20260831121000_mentoria_forms.sql`, chave
`diagnostico_raiox` — não `diagnostico_inicial`), com 5 blocos e 45 campos.
Mudar conteúdo é criar a v2 por migration, ou editar pelo builder do admin
(que gera versão nova a cada salvamento). Cuidado com o builder: ele deriva a
`key` do campo a partir do label, então **renomear um rótulo troca a key** e
desconecta respostas antigas e `metric_key` — que, aliás, não é editável por lá.

- **O Bloco A duplica o cadastro da empresa.** O `CompanyForm` de Configurações
  já coleta nome, cidade, telefone, Instagram e site; o diagnóstico pede os
  cinco de novo, guardando noutro lugar (JSON de respostas vs. registro
  `company`). O aluno digita duas vezes e os dois podem divergir.
  *Decidido: manter duplicado — a Foto Zero deve ser autocontida e imutável, e
  depender do cadastro (que muda) descaracterizaria o "antes".*
- **Foto Zero irreversível com só 3 obrigatórios em 45.** A validação de
  obrigatórios é só no backend (`assertRequiredAnswered`), sem destaque no
  campo: dá para congelar um diagnóstico quase vazio, e não há como refazer.
  *Decidido: não mexer nesta rodada.*
- **Seis `metric_key` órfãos.** `vendas`, `ticket`, `recorrencia`,
  `funcionarios`, `equipamentos` e `gargalo` prometem comparação que o
  relatório não entrega — o lado "Agora" (`currentMetrics`) só produz
  `faturamento`, `custos_fixos`, `margem`, `maturidade_*` e `kpis`.
  *Decidido: deixar como está; ou se cria a contraparte, ou se tira o
  `metric_key`.*
- Menores: os títulos "Bloco A —"… vazam a nomenclatura interna da spec para o
  aluno; `scale` renderiza 0–10 mas o builder o rotula "Escala (1–5)";
  `multiselect` e `file` existem no tipo e caem no `<input type="text">`;
  `allow_unknown` é inconsistente entre blocos (o Bloco C inteiro tem, A e E
  nenhum) apesar do princípio declarado de que não saber também é diagnóstico;
  `email`/`telefone`/`site` são `text` sem validação de formato.

---

## C. Decisões visuais desta rodada

1. **Componente do DS quando existe; DOM + classes de token quando não existe.**
   O DS é React Native + react-native-web, então importar componentes dele
   arrasta esse runtime. `Button` e `Badge` vêm do DS; card, grid e donut são
   `<div>` vestidos com `rounded-card`, `bg-surface`, `border-subtle`.

2. **Tokens semânticos, não pares `dark:`.** `bg-surface`, `text-primary`,
   `text-secondary`, `text-muted`, `border-subtle`, `bg-brand-wash` resolvem os
   dois temas sozinhos. Todo `slate-*` / `gray-*` / `teal-*` saiu dos arquivos
   tocados. Onde o par `dark:` sobrou, é a lacuna A.3, sempre comentada no ponto.

3. **Steps tipográficos do DS** (`text-page`, `text-section`, `text-title`,
   `text-body`, `text-label`, `text-caption`) no lugar de `text-sm` +
   `font-semibold` avulsos — cada step carrega tamanho, altura de linha, peso e
   tracking juntos.

4. **Navegação mudou de lugar.** O sub-menu expansível dentro da sidebar global
   do curso foi **removido** (`mentoria-sidebar.tsx` deletado; o
   `course-sidebar.tsx` perdeu o `if (item.label === 'Mentoria 360°')`, que
   quebraria em silêncio se alguém renomeasse o rótulo). A lista canônica agora
   é `src/modules/mentoria/nav.ts`, consumida pelo card lateral em
   `mentoria/layout.tsx`.

5. **O padding virou responsabilidade do layout.** `mentoria/layout.tsx` aplica
   `p-4 md:p-8` uma vez; as ~18 ocorrências espalhadas pelas páginas filhas
   foram removidas para não dobrar o espaçamento.

6. **`CompanyForm` saiu da home.** O desenho não tem formulário no dashboard,
   mas é o único lugar onde o aluno edita a empresa. Virou seção sob demanda,
   aberta pelo botão "Dados da empresa" do cabeçalho — não modal, porque o
   `Modal` do DS não rola (A.5).

7. **O Assistente é coluna, não overlay.** Ele entra como terceira coluna da
   grade (`mentoria-shell.tsx`), empurrando o conteúdo em vez de cobri-lo — por
   isso não tem backdrop, portal nem trava de scroll. Entre `lg` e `xl` não
   cabem três colunas, então o painel desce para uma linha própria
   (`lg:col-span-2 xl:col-span-1`). O estado mora no shell porque o gatilho está
   na coluna 1 e o painel na coluna 3.

   Visualmente os dois são **cards flutuantes presos na tela**: superfície única
   com `shadow-overlay` e `sticky top-6`, com o conteúdo do meio rolando por
   baixo. `sticky` e não `fixed` de propósito — o course shell anima o `<main>`
   com `transform`, e transform cria containing block, então `fixed` ancoraria no
   `<main>` em vez do viewport (a mesma armadilha que obriga os modais do app a
   usar `ModalPortal`). Ambos ganham `max-h-[calc(100vh-3rem)]` com scroll
   próprio, senão numa viewport baixa o fim da coluna fica inalcançável.

8. **Entrou `motion` + `AnimatePresence`** (`motion/react`, já era dependência).
   É o **primeiro `AnimatePresence` do repositório**: a convenção até aqui eram
   `@keyframes` em `globals.css` com desmonte seco, e um painel que some de
   estalo parece quebrado. Custo assumido: `motion` passa a entrar no bundle do
   course shell, onde antes só aparecia em landing. `useReducedMotion()` colapsa
   o deslize para um fade curto.

9. **Container queries no lugar de breakpoint de viewport.** Onde o conteúdo
   divide espaço com o Assistente, os grids passaram a `@container` +
   `@2xl:`/`@4xl:`. O motivo é direto: abrir o painel tira 384px da coluna do
   meio sem mudar a largura da janela, então `md:`/`xl:` continuariam achando
   que há espaço e espremeriam duas colunas de formulário (ou quatro cartões de
   KPI) num vão que não comporta. Se esquecer o `@container` no ancestral, a
   variante nunca ativa e fica **uma coluna só, silenciosamente** — é o modo de
   falhar a vigiar.

10. **Rotas `(dev)` como banco de prova de estado.** `dynamic-form` e a tela do
    Diagnóstico ganharam `app/(dev)/mentoria-diagnostico-check`, que monta os
    quatro casos com fixtures de `modules/mentoria/__fixtures__/`. Não é
    capricho: o estado "Foto Zero congelada" é **irreversível** (o backend
    recusa o segundo envio e o snapshot é imutável por trigger), então conferir
    o modo leitura no ambiente real custaria uma jornada queimada por ajuste. O
    template das fixtures também tem um campo de **cada** tipo — o de produção
    não usa `select` nem `scale`, e esses ramos passariam despercebidos.
    Isso exigiu partir a tela em container (`page.tsx`) e apresentação
    (`_components/diagnostico-view.tsx`).

### Pendência de design, fora do escopo

`src/utils/constants/tool-colors.ts` ainda define a Mentoria como
**teal → cyan** (`from-teal-500 to-cyan-700`), enquanto o interior da feature é
violeta (`brand` `#7c3aed`). Trocar propaga para a home do curso
(`quick-access.ts`) e para a landing — **precisa de aval do design** antes de
mexer.

---

## Próximas rodadas

- Restante da área do aluno: `ferramentas/` (+ os 6 tipos), `evolucao/` (+ CSS
  de impressão do Raio-X 360°: hoje `window.print()` sai com o shell inteiro),
  `configuracoes/` e o dashboard "Minha Empresa" (`mentoria/page.tsx`, que já usa
  as primitivas novas mas continua num arquivo só, sem view separada nem rota de
  conferência).
- `src/app/mentoria-admin/**` inteiro.
- Componentes compartilhados: `company-map-radar`, `semaphore-badge` (reescrever
  sobre o `Badge` do DS, mantendo rótulo textual — cor sozinha não é acessível).
- Deprecar `INPUT` / `BTN_PRIMARY` / `BTN_GHOST` de
  `mentoria/_components/shared.tsx` em favor de `Input` / `Button` do DS.

**Dívidas específicas deixadas pela rodada do Diagnóstico:**

- **Padding em dobro em 10 páginas.** O `mentoria/layout.tsx` aplica
  `p-4 md:p-8` e as páginas aplicam de novo — `desenvolvimento`, `evolucao`,
  `ferramentas` (×2), `indicadores`, `jornada` (×2), `lives` (×2) e `tarefas`.
  Sobra do refactor que criou o layout da área; `diagnostico/` e o dashboard já
  estão limpos. Correção mecânica, cabe num commit próprio.
- **O `dynamic-form` migrado aparece em 3 telas ainda não migradas.**
  `desenvolvimento/` (×2), `tools/tool-form.tsx` (×2) e o preview do
  form-builder do admin herdaram o formulário tokenizado dentro de molduras
  `teal`/`slate`. É inconsistência esperada e temporária, não regressão.
- **Container queries do dashboard.** `mentoria/page.tsx` ainda usa `sm:`/`lg:`/
  `xl:` nos grids, então com o Assistente aberto ele espreme 4 cartões de KPI
  numa coluna que comporta 2. Mesmo tratamento do item 9 de C resolve.
