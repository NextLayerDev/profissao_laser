# Migração — Tracker da Onda 1

> Consolidar services legados nos módulos que **já existem**. Sem criar pastas
> novas. Padrão e receita completos em [`ARCHITECTURE.md`](./ARCHITECTURE.md).
> Os arquivos-esqueleto já foram criados (com checklist no topo) e **ainda não
> estão exportados nos `index.ts`** — o build segue verde até serem preenchidos.

## Checklist por arquivo-esqueleto criado

### 1. `subscriptions`
- [x] `modules/subscriptions/services/entitlements.service.ts` ← `src/services/entitlements.ts` (Zod já existia)
- [x] `modules/subscriptions/types/entitlements.ts` (+ schemas) — lógica crítica
- [x] `modules/subscriptions/hooks/use-entitlements.ts` (`ENTITLEMENTS_KEY`, `useEntitlements`)
- [x] **Testes** `entitlements.service.test.ts` (MSW: parse, course_slug, subscription nula, schema inválido) ✓
- [x] 17 consumidores (3 service + 14 hook) repontados p/ `@/modules/subscriptions`; legados deletados; build limpo.
- [ ] `modules/subscriptions/services/addons.service.ts` ← `src/services/addons.ts` (+ `types/addons.ts`)
- [ ] `modules/subscriptions/services/provisioning.service.ts` ← `src/services/provisioning.ts`
- [ ] Mover `src/services/purchase.ts`
- [ ] Mover `src/services/my-subscription.ts` (hoje legado, já consome o módulo)
### Colisão subscription legado vs upvox — INVESTIGADO (decisão: upvox é o futuro)

Existem dois sistemas de assinatura homônimos:
- **Legado** `src/services/subscription.ts` + `src/hooks/use-subscription.ts` +
  `src/hooks/use-my-subscription.ts` (+ bridge `src/services/my-subscription.ts`) →
  API antiga `/subscription`. **É o que a UI usa hoje** (checkout, troca de plano admin,
  página `assinatura`).
- **upvox (alvo)** `modules/subscriptions` → `/v1/subscription`. Decisão do dono:
  **é a fonte de verdade FUTURA.** Hoje só `getEntitlements`, `listMySubscriptions` e
  `cancelSubscription` (via bridge) estão em uso; as mutações `createSubscription`/
  `upgradeSubscription`/`downgradeSubscription` e os 5 hooks (`useMySubscriptions`,
  `useCreate/Upgrade/Downgrade/CancelSubscription`) estão prontos mas **não ligados na UI**.

**RESOLVIDO (write-path).** A spec do backend confirmou que as rotas reais de escrita
são `/subscription`, `/subscription/upgrade`, `/subscription/downgrade` (não `/v1/...`).
O módulo agora implementa essas rotas reais (portado do legado, que estava correto):
- [x] `subscriptions.service.ts` reescrito p/ rotas reais (`createSubscription`,
      `upgradeSubscription`, `downgradeSubscription`); read/cancel `/v1/...` mantidos.
- [x] types: `CreateSubscriptionPayload` (email/stripeProductId/...),
      `SubscriptionChangePayload` (`{productId}`), `SubscriptionChangeResponse`.
- [x] hooks reescritos; comentário "dead code" removido (agora é a casa real).
- [x] Consumidores repontados: `create-subscription-modal`, `checkout-confirm-button`,
      `hooks/use-my-subscription` (upgrade/downgrade), `utils/parse-subscription-csv`.
- [x] **Testes** `subscriptions.service.test.ts` (MSW: create 201, upgrade/downgrade + schema inválido) ✓
- [x] Legado deletado: `services/subscription.ts`, `hooks/use-subscription.ts`,
      `types/subscription.ts`, `types/subscription-change.ts`.
      Dead code dropado no caminho: `adminChangePlan`/`useAdminChangePlan`,
      `cancelSubscription({email,subscriptionId})` (rota `/customer/subscription/cancel`).

**Resta (read/cancel "minha assinatura"), em pass futuro:**
- [ ] Mover o bridge `services/my-subscription.ts` + `hooks/use-my-subscription.ts` +
      `types/my-subscription.ts` para dentro do módulo (leitura via `listMySubscriptions`
      + `getEntitlements`; cancel via `cancelSubscription(id)` `/v1/.../cancel`).
- ⚠️ Confirmar com o backend se `/v1/me/subscriptions` e `/v1/subscription/{id}/cancel`
      são as rotas oficiais (não vieram na spec compartilhada).

### subscriptions — moves mecânicos restantes (independentes da colisão)
- [ ] `modules/subscriptions/services/addons.service.ts` ← `src/services/addons.ts` (+ `types/addons.ts`)
- [ ] `modules/subscriptions/services/provisioning.service.ts` ← `src/services/provisioning.ts`
- [ ] Mover `src/services/purchase.ts`

### 2. `courses`
- [ ] `modules/courses/services/classes.service.ts` ← `src/services/classes.ts` (+ `system-classes.ts`)
- [ ] `modules/courses/services/progress.service.ts` ← `src/services/progress.ts`
- [ ] `modules/courses/services/saved-lessons.service.ts` ← `src/services/saved-lessons.ts`
- [ ] `modules/courses/types/classes.ts` ← `src/types/classes.ts` (+ Zod)
- [ ] Mover `src/services/quiz.ts` (consolidar com `quizzes.service.ts` existente)
- [ ] Mover `src/services/courses-auth.ts`, `src/services/course.ts`

### 3. `plans`
- [x] `modules/plans/services/landing-plans.service.ts` ← `src/services/landing-plans.ts`
- [x] `modules/plans/types/landing-plans.ts` (view model — Zod fica no service, sobre `planSchema`)
- [x] `modules/plans/hooks/use-landing-plans.ts` (`landingPlansQueryKey` exportada)
- [x] Consumidores migrados p/ `@/modules/plans`; legados deletados; build limpo.

### 4. `catalog`
- [x] `modules/catalog/services/products.service.ts` ← `src/services/products.ts` (client → `apiCourses`; upload via apiCourses)
- [x] `modules/catalog/types/products.ts` (Zod já existia)
- [x] `modules/catalog/hooks/use-products.ts` (`productsQueryKey` exportada)
- [x] ~30 consumidores migrados p/ `@/modules/catalog`; legados deletados; build limpo.
- Nota: `lib/duplicate-product.ts` importa os subcaminhos do catalog (não o barrel) para evitar ciclo com o hook.

### 5. `access`
- [x] `modules/access/services/auth.service.ts` ← `src/services/auth.ts` (client → `apiCourses`)
- [x] `modules/access/types/auth.ts` (Zod já existia; login/registro movidos)
- [x] `modules/access/hooks/use-auth.ts` (`useLogin`/`useRegisterCustomer`/`useRegisterUser`)
- [x] Consumidores (`app/login`, `app/register`) → `@/modules/access`; legados deletados; build limpo.
- Nota: `UpdateCustomerPayload` ficou em `src/types/auth.ts` (domínio customer → migra com `account`).

## Pré-requisitos (Onda 0)

Antes de preencher os esqueletos, garanta que a Onda 0 está feita:
- [ ] Route groups `app/(student)/` e `app/(admin)/` criados.
- [x] `optimizePackageImports` no `next.config.ts` (lucide-react, recharts + módulos migrados).
- [x] Ambiente de testes (Vitest + Testing Library + MSW) configurado: `npm test`,
      `vitest.config.ts`, `vitest.setup.ts`, `src/test/msw/server.ts`. Job `test`
      no CI gateando o deploy. Exemplos: `src/lib/cpf.test.ts` (unidade) e
      `src/modules/catalog/services/products.service.test.ts` (service + MSW).

## Definição de pronto (cada item)

1. Funções portadas usando `@/shared/lib/api-courses`; respostas validadas com Zod.
2. Hooks relacionados movidos para `hooks/` do módulo (exportar `queryKey`).
3. Item exportado no `index.ts` do módulo (componentes pesados via `next/dynamic`).
4. Consumidores atualizados para `@/modules/<dominio>`.
5. Página movida para a face certa e convertida para Server Component + Suspense.
6. **Testes**: service/hook com MSW (sucesso + erro) e teste de interface da view.
7. Arquivos legados (`src/services/*`, `src/types/*`, `src/hooks/*`) deletados.
8. `npx biome check --write` + build limpo + testes passando.
9. PR aberto (1 por módulo).
