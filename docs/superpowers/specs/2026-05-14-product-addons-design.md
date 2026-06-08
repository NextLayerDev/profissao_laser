# Product Addons — Design

Data: 2026-05-14
Status: aprovado (aguardando review do usuário)

## Objetivo

Integrar no frontend Next.js as novas rotas de addons:

- **POST `/addon`** (admin) — cria um produto Stripe marcado como addon (`type: "addon"`).
- **POST `/subscription/addon`** (cliente) — anexa um addon à assinatura ativa do cliente, com proração imediata.
- **GET `/subscription/addons`** (cliente) — lista os addons ativos da assinatura.
- **DELETE `/subscription/addon/:itemId`** (cliente) — remove um addon (proração creditada no próximo invoice).

Camadas afetadas: `src/types/`, `src/services/`, `src/hooks/`, `src/app/products/`, `src/components/products/`, `src/components/assinatura/`, e a página de assinatura do cliente.

## Modelo de dados

Os addons são `pl_product` com `type: "addon"`. O schema de produto atual (`src/types/products.ts`) já aceita `type: z.string()`, então **nenhuma mudança no `productSchema` é necessária**. Addons aparecem no mesmo `GET /products` e são distinguidos por `product.type === 'addon'`.

Novos tipos em `src/types/addons.ts`:

```ts
export const createAddonPayloadSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  interval: z.enum(['month', 'year', 'one_time']).default('month'),
});
export type CreateAddonPayload = z.infer<typeof createAddonPayloadSchema>;

export const subscriptionAddonItemSchema = z.object({
  itemId: z.string(),          // si_... do Stripe (usado no DELETE)
  productId: z.uuid(),
  productName: z.string(),
  stripePriceId: z.string(),
  quantity: z.number().int().positive(),
  subscriptionId: z.string().optional(), // só vem no POST
});
export type SubscriptionAddonItem = z.infer<typeof subscriptionAddonItemSchema>;

export const removeAddonResponseSchema = z.object({
  removed: z.literal(true),
  itemId: z.string(),
});
```

A resposta de `POST /addon` é validada com o `productSchema` existente.

## Camada de serviços

Novo arquivo `src/services/addons.ts`:

- `createAddon(payload: CreateAddonPayload): Promise<Product>` → `POST /addon`
- `attachAddon(productId: string): Promise<SubscriptionAddonItem>` → `POST /subscription/addon`
- `listMyAddons(): Promise<SubscriptionAddonItem[]>` → `GET /subscription/addons`
- `removeAddon(itemId: string): Promise<{ removed: true; itemId: string }>` → `DELETE /subscription/addon/:itemId`

Cada função valida a resposta com o schema correspondente, espelhando o padrão de `src/services/products.ts` e `src/services/subscription.ts`.

## Camada de hooks (React Query)

Novo arquivo `src/hooks/use-addons.ts`:

- `useCreateAddon()` — mutation; invalida `['products']`.
- `useMyAddons()` — query com `queryKey: ['my-addons']`.
- `useAttachAddon()` — mutation; invalida `['my-addons']` e `['my-subscription']`.
- `useRemoveAddon()` — mutation; invalida `['my-addons']` e `['my-subscription']`.

Mesma forma dos hooks já existentes (`use-products.ts`, `use-my-subscription.ts`).

## UI — Admin

Local: `src/app/products/page.tsx` e `src/components/products/`.

1. **Novo botão "Novo Addon"** ao lado do "Novo Produto" no header da página `/products`.
2. **Novo modal `src/components/products/create-addon-modal.tsx`** — formulário enxuto com 4 campos: `name`, `description`, `price`, `interval`. Usa `useCreateAddon`. Sucesso → fecha e toast.
3. **Badge "Addon"** no `product-card.tsx` quando `product.type === 'addon'`. Já que `GET /products` retorna addons no mesmo array, eles aparecem na grid sem refactor extra.

Não é necessário alterar `basic-info-section.tsx` nem o fluxo de produto normal — o modal de addon é independente.

## UI — Cliente

Local: `src/app/assinatura/page.tsx` + `src/components/assinatura/`.

Novo componente `src/components/assinatura/addons-section.tsx`, renderizado abaixo do plano principal na página de assinatura. Mostra duas áreas:

1. **"Meus addons"** — lista de `SubscriptionAddonItem` via `useMyAddons()`. Cada item tem `productName`, `quantity`, e botão "Remover" que dispara `useRemoveAddon` com confirmação (modal simples reutilizando padrão do `cancel-subscription-modal.tsx`). Empty state: "Você ainda não tem addons ativos."
2. **"Addons disponíveis"** — lista de `products` com `type === 'addon'` (via `useProducts`) que ainda **não** estão na lista de meus addons. Botão "Adicionar" chama `useAttachAddon` com confirmação de proração imediata.

A seção só aparece se o cliente tem assinatura ativa (já checado no contexto da página).

## Tratamento de erros

As mensagens do backend são propagadas via `api` (axios) — tratadas com `sonner` toast no `onError` de cada mutation. Mensagens específicas a tratar com cópia amigável:

- `Addon already attached to subscription` → "Esse addon já está ativo na sua assinatura."
- `No active or trialing Stripe subscription found` → "Você precisa ter uma assinatura ativa pra adicionar addons."
- `Cannot remove the main plan item` → bloqueado pela UI (não exibimos botão remover no plano principal); fallback toast genérico se chegar.

Outros erros caem no toast genérico já usado nos outros hooks.

## Arquivos criados/modificados

**Criados:**
- `src/types/addons.ts`
- `src/services/addons.ts`
- `src/hooks/use-addons.ts`
- `src/components/products/create-addon-modal.tsx`
- `src/components/assinatura/addons-section.tsx`
- `src/components/assinatura/remove-addon-modal.tsx`

**Modificados:**
- `src/app/products/page.tsx` (botão "Novo Addon")
- `src/components/products/product-card.tsx` (badge)
- `src/app/assinatura/page.tsx` (renderiza `<AddonsSection />`)

## Fora de escopo

- Edição de addon (PATCH não existe nas rotas).
- Mudança de quantidade (`quantity` é sempre 1 por enquanto).
- Listagem admin separada por tipo (filtros podem vir depois).
- Webhook handling — backend já cuida.
