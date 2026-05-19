# Integração do sistema de Vox (créditos) no front

Data: 2026-05-18
Status: aprovação pendente

## Contexto

O backend já expõe um sistema de créditos (endpoints `/credits/*`) com cobrança,
cota grátis para prévia, checkout Stripe e webhook. A moeda chama-se **Vox**
(plural **voxes**). O front precisa integrar: exibição de saldo, compra de
pacotes, consumo das features pagas com confirmação explícita e painel admin.

Todas as rotas de crédito usam o header `Authorization: Bearer <token>` — já
injetado automaticamente pelo interceptor em `src/lib/fetch.ts`.

### Decisões tomadas no brainstorming

- **Rótulo da moeda na UI:** "vox" / "voxes" (ex.: "Saldo: 10 voxes",
  "Custa 1 vox"). Os endpoints da API permanecem `/credits/*`; o termo "vox" é
  apenas de apresentação.
- **Hub do cliente:** página dedicada `app/course/(shell)/voxes/page.tsx`
  (rota `/course/voxes`, rótulo "Voxes"), com saldo, pacotes e extrato. Item
  novo no sidebar (seção FERRAMENTAS) + pill de saldo no top header.
- **Confirmação de gasto:** **proativa** — ao acionar a feature, ler
  custo+saldo do cache, abrir modal "Isso custa X voxes (você tem Y).
  Confirmar?" e só então chamar a API já com a flag `useCredits`. Evita o
  round-trip do 402. Prévia continua usando a cota grátis primeiro.
- **Vetorização:** migrar do proxy local Next (`app/api/vectorize/route.ts`)
  para o endpoint multipart do **backend** com `useCredits`. O proxy local é
  aposentado. Assume-se que o backend já expõe esse endpoint.
- **Admin:** reaproveitar a aba "Voxes" de `/products` (que hoje lista addons).
  A aba ganha **sub-abas internas**: `Addons` (o que já existe, intocado) +
  `Pacotes`, `Custos`, `Ajuste manual` (config de crédito). Addons e config de
  vox convivem; nada de addons é removido.
- **Retorno do Stripe:** o sucesso volta para a página do curso. O hub de voxes
  (e a pill) revalidam o saldo ao montar; havendo `?session_id` na URL, exibe
  faixa "pagamento em processamento" e faz polling do saldo até subir. O
  retorno da URL nunca é tratado como confirmação de pagamento.

## Arquitetura

Segue os padrões já existentes no projeto: `services/*.ts` (wrappers do `api`
axios + validação `zod`), `hooks/use-*.ts` (TanStack Query + `sonner`),
componentes em `components/<dominio>/`, `ModalOverlay` para modais.

### Unidades e responsabilidades

```
types/credits.ts            tipos + schemas zod (Balance, Cost, Package,
                            HistoryEntry, Credit402, DailyLimit429, payloads admin)
services/credits.ts         wrappers do api: balance, costs, packages, history,
                            checkout + admin (allPackages, create/update/status
                            package, updateCost, adjust)
hooks/use-credits.ts        useCreditBalance, useCreditCosts, useCreditPackages,
                            useCreditHistory, useCreateCheckout + hooks admin
components/credits/
  credit-confirm-modal.tsx  modal compartilhado (estado confirmar / sem saldo)
  credits-view.tsx          hub /course/voxes (saldo, pacotes, extrato, polling)
hooks/use-credit-action.ts  orquestra confirmação proativa + 402/429 + revalidação
```

### 1. Camada base

- **`types/credits.ts`** — interfaces e schemas `zod` (padrão `customer.ts`):
  - `VoxBalance { balance: number }`
  - `VoxCost { feature: 'previa'|'vectorize'|'editor-ai'; cost: number; label: string }`
  - `VoxPackage { id; name; description; credits; price }`
  - `VoxHistoryEntry { id; type: 'purchase'|'debit'|'refund'|'adjustment'; amount; balanceAfter; feature; createdAt }`
  - `VoxHistoryResponse { data; total; page; limit }`
  - `Vox402 { message; reason: 'confirmation_required'|'insufficient_balance'; feature; cost; balance }`
  - `VoxDailyLimit429 { code:'DAILY_LIMIT_REACHED'; limit; used; resetsAt; creditOption: { cost; balance; canUseCredits } | null }`
  - payloads admin: `CreatePackagePayload`, `UpdatePackagePayload`, `AdjustVoxPayload`.

- **`services/credits.ts`** — funções finas sobre `api`:
  - Cliente: `getBalance`, `getCosts`, `getPackages`, `getHistory({page,limit})`,
    `createCheckout(packageId)`.
  - Admin: `getAllPackages`, `createPackage`, `updatePackage(id)`,
    `setPackageStatus(id, active)`, `updateCost(feature, cost)`,
    `adjustVox({customerId, amount, reason})`.

- **`hooks/use-credits.ts`** — TanStack Query:
  - `useCreditBalance()` — `queryKey ['credits','balance']`, `staleTime` ~30s;
    usado pela pill e pelo hub.
  - `useCreditCosts()` — `staleTime` alto (raramente muda).
  - `useCreditPackages()`, `useCreditHistory(page,limit)`.
  - `useCreateCheckout()` — mutation; `onSuccess` →
    `window.location.href = checkoutUrl`.
  - Hooks admin com `invalidateQueries` + `toast` (padrão `use-previas.ts`).

### 2. Camada de cobrança (núcleo)

- **`components/credits/credit-confirm-modal.tsx`** — reusa `ModalOverlay`.
  Props: `feature`, `cost`, `balance`, `onConfirm`, `onClose`, `variant`.
  - `variant='confirm'`: "Isso custa **{cost} vox(es)** — você tem **{balance}**.
    Confirmar?" + botões Cancelar / Confirmar.
  - `variant='insufficient'`: "Saldo insuficiente" + CTA "Comprar voxes"
    (→ `/course/voxes`).
  - `variant='daily-limit'` (prévia): mensagem da cota + opção "Usar 1 vox
    (saldo: N)" quando `creditOption.canUseCredits`, senão CTA comprar.

- **`hooks/use-credit-action.ts`** — `useCreditAction({ feature, run })`:
  - `run(opts: { useCredits: boolean }) => Promise<T>` é fornecido por cada
    feature (encapsula a mutation).
  - Fluxo proativo: ao disparar, lê `costs`+`balance` do cache; se saldo ≥
    custo → abre modal `confirm`; senão → modal `insufficient`.
  - Confirmado → `run({ useCredits: true })`.
  - Tratamento de erro (inspeciona `error.response`):
    - `402 confirmation_required` → reabre modal `confirm`.
    - `402 insufficient_balance` → modal `insufficient`.
    - `429 DAILY_LIMIT_REACHED` (só prévia) → modal `daily-limit` com
      `creditOption`.
    - sucesso → `queryClient.invalidateQueries(['credits','balance'])`.
  - Estorno automático no backend em falha de IA: o front só trata o erro
    normal e revalida o saldo (o usuário não perde vox por erro do servidor).

### 3. Integração nas 3 features

- **Prévia** (`components/previas/previas-view.tsx`, `hooks/use-previas.ts`,
  `services/previas.ts`):
  - `GeneratePreviaPayload` ganha `useCredits?: boolean`.
  - O `catch {}` atual em `previas-view.tsx` (linha ~936) passa a inspecionar
    `error.response` e delegar 429/402 ao `useCreditAction`.
  - `QuotaBanner` mostra, quando a cota acaba, a opção de usar vox conforme
    `creditOption`.

- **Vetorização** (migração):
  - `services/vectorize.ts`: reescrever `vectorizeImage` para usar o `api`
    axios apontando ao endpoint backend multipart; `FormData` com o arquivo +
    campo `useCredits` como string `"true"` quando confirmado.
  - Aposentar `app/api/vectorize/route.ts` (deletar a rota e o uso do proxy).
  - Consumidores (`vetorizacao-view.tsx`, `vectorization-upload.tsx`,
    `vector-list.tsx`) passam pelo `useCreditAction`.

- **Editor IA** (`components/canva/design-editor-view.tsx`,
  `hooks/use-editor-ai.ts`, `services/editor-ai.ts`):
  - `EditorAiPayload` e `RemoveBackgroundPayload` ganham `useCredits: boolean`.
  - `editorAiGenerate` e `removeBackground` passam pelo `useCreditAction`.
  - `applyColor` permanece intocado (não consome vox).

### 4. Hub do cliente — `/course/voxes`

- `app/course/(shell)/voxes/page.tsx` + `components/credits/credits-view.tsx`:
  - Card de saldo (`useCreditBalance`).
  - Grid de pacotes (`useCreditPackages`) → botão "Comprar" →
    `useCreateCheckout` → redirect para `checkoutUrl`.
  - Extrato paginado (`useCreditHistory`) com badge por `type`
    (purchase/debit/refund/adjustment).
- Novo item em `src/utils/constants/quick-access.ts` (seção FERRAMENTAS,
  ícone `Coins`, label "Voxes", href `/course/voxes`).
- **Pill de saldo** em `components/course/home/course-top-header.tsx` ao lado
  do ícone `CreditCard`: mostra `{balance}` via `useCreditBalance`, link para
  `/course/voxes`.
- **Retorno Stripe:** `credits-view` ao montar revalida `balance`. Se a URL
  tiver `?session_id`, exibe faixa "Pagamento em processamento — o saldo
  aparece em instantes" e faz polling do `balance` (intervalo curto, ~6
  tentativas) até o saldo subir; depois remove a faixa. Sem tratar a URL como
  confirmação.

### 5. Painel admin — sub-abas na aba "Voxes" de `/products`

- `app/products/page.tsx`: a aba "Voxes" (hoje `activeTab === 'addons'`) passa
  a renderizar um componente com **sub-abas internas**:
  - `Addons` — exatamente o conteúdo atual (lista de addons + `CreateAddonModal`),
    movido sem alteração de comportamento.
  - `Pacotes` — `getAllPackages` (inclui inativos); criar/editar
    (`name, description?, credits, price`), ativar/desativar
    (`PATCH .../status`). Aviso de que cria produto/preço no Stripe.
  - `Custos` — editar custo de `previa`/`vectorize`/`editor-ai`
    (`PUT /credits/costs/:feature`).
  - `Ajuste manual` — form `customerId` + `amount` (±) + `reason`
    (`POST /credits/adjust`); saldo nunca fica < 0 (validação do backend).
- `components/products/credits-admin-section.tsx` orquestra as sub-abas.
  Modais reusam `ModalOverlay` (padrão `CreateAddonModal`).
- A lógica de filtro de addons em `app/products/page.tsx` é preservada; só a
  organização visual da aba muda (passa a ter sub-abas).

## Erros, loading e estados

- Mapa central de status: `200/201` → revalidar saldo; `402` → modal
  (confirm/insufficient); `429 DAILY_LIMIT_REACHED` → modal daily-limit;
  `403` → o interceptor de `lib/fetch.ts` já redireciona ao login.
- Toasts via `sonner` (padrão do app). Loading/empty reusando
  `components/ui/loading-state.tsx`, `empty-state.tsx`, `skeleton.tsx`.

## Testes / verificação

O projeto não tem suíte de testes nem runner configurado hoje. Verificação:
`npm run build` + `npm run lint` (biome) sem erros, e checagem manual dos
fluxos (saldo, compra→retorno→polling, confirmação proativa em prévia/
vetorização/editor, 402/429, admin pacotes/custos/ajuste). Caso um runner de
testes seja adotado, adicionar testes de `use-credit-action` (mapeamento de
402/429) e dos services.

## Fora de escopo (YAGNI)

- Webhook/Stripe no backend (já existe).
- i18n, atualização de saldo em tempo real (websocket).
- Animações de contagem de saldo, gamificação.
- Remoção/migração de addons (ficam como estão).

## Premissas a confirmar

- O backend expõe um endpoint multipart de vetorização que aceita
  `useCredits` e retorna o SVG (substituto do proxy local).
- `COURSES_URL` (success URL do Stripe) aponta para o app do curso (qualquer
  rota sob `/course` serve, pois o polling do saldo é feito no hub/pill).
