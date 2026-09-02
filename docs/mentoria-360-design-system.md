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

### A.2 Outros vãos do catálogo

Sem uso nesta rodada, mas já sentidos nas telas seguintes: **Tabs**,
**Sidebar/Nav**, **PageHeader/Shell**, **Progress bar**, **Tooltip**,
**Toast**, **Dropdown/Menu**, **Skeleton**, **Pagination**, **charts**.
Localmente supridos por `recharts` (gráficos) e `sonner` (toasts).

O Assistente somou outro vão: **nada de chat**. Não há composer que cresça com o
conteúdo, bolha de mensagem, estado de "digitando" nem painel lateral. O app já
tem quatro superfícies de chat (`live-chat`, `tool-agent-chat`,
`support-chat-widget`, `doubt-chat-view`), cada uma com o seu — é candidato
forte a virar componente do DS.

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
  linha e não expõe `onSubmitEditing` no topo (só por dentro de `inputProps`); o
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

### Pendência de design, fora do escopo

`src/utils/constants/tool-colors.ts` ainda define a Mentoria como
**teal → cyan** (`from-teal-500 to-cyan-700`), enquanto o interior da feature é
violeta (`brand` `#7c3aed`). Trocar propaga para a home do curso
(`quick-access.ts`) e para a landing — **precisa de aval do design** antes de
mexer.

---

## Próximas rodadas

- Restante da área do aluno: `diagnostico/`, `jornada/` (timeline dos 10
  encontros), `ferramentas/` (+ os 6 tipos), `desenvolvimento/` (maior
  concentração de teal restante), `tarefas/`, `indicadores/`, `evolucao/`
  (+ CSS de impressão do Raio-X 360°: hoje `window.print()` sai com o shell
  inteiro), `lives/` (player + chat empilhados no mobile).
- `src/app/mentoria-admin/**` inteiro.
- Componentes compartilhados: `dynamic-form`, `company-map-radar`,
  `semaphore-badge` (reescrever sobre o `Badge` do DS, mantendo rótulo textual —
  cor sozinha não é acessível), `live-player`, `live-chat`.
- Deprecar `INPUT` / `BTN_PRIMARY` / `BTN_GHOST` de
  `mentoria/_components/shared.tsx` em favor de `Input` / `Button` do DS.
