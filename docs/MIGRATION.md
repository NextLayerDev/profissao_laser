# Migração — Tracker da Onda 1

> Consolidar services legados nos módulos que **já existem**. Sem criar pastas
> novas. Padrão e receita completos em [`ARCHITECTURE.md`](./ARCHITECTURE.md).
> Os arquivos-esqueleto já foram criados (com checklist no topo) e **ainda não
> estão exportados nos `index.ts`** — o build segue verde até serem preenchidos.

## Checklist por arquivo-esqueleto criado

### 1. `subscriptions`
- [ ] `modules/subscriptions/services/addons.service.ts` ← `src/services/addons.ts`
- [ ] `modules/subscriptions/services/entitlements.service.ts` ← `src/services/entitlements.ts`
- [ ] `modules/subscriptions/services/provisioning.service.ts` ← `src/services/provisioning.ts`
- [ ] `modules/subscriptions/types/addons.ts` ← `src/types/addons.ts` (+ Zod)
- [ ] `modules/subscriptions/types/entitlements.ts` ← `src/types/entitlements.ts` (+ Zod)
- [ ] Dedupe `src/services/subscription.ts` + `src/services/my-subscription.ts` com o `subscriptions.service.ts` existente
- [ ] Mover `src/services/purchase.ts`

### 2. `courses`
- [ ] `modules/courses/services/classes.service.ts` ← `src/services/classes.ts` (+ `system-classes.ts`)
- [ ] `modules/courses/services/progress.service.ts` ← `src/services/progress.ts`
- [ ] `modules/courses/services/saved-lessons.service.ts` ← `src/services/saved-lessons.ts`
- [ ] `modules/courses/types/classes.ts` ← `src/types/classes.ts` (+ Zod)
- [ ] Mover `src/services/quiz.ts` (consolidar com `quizzes.service.ts` existente)
- [ ] Mover `src/services/courses-auth.ts`, `src/services/course.ts`

### 3. `plans`
- [ ] `modules/plans/services/landing-plans.service.ts` ← `src/services/landing-plans.ts`
- [ ] `modules/plans/types/landing-plans.ts` (+ Zod)

### 4. `catalog`
- [ ] `modules/catalog/services/products.service.ts` ← `src/services/products.ts`
- [ ] `modules/catalog/types/products.ts` (+ Zod)

### 5. `access`
- [ ] `modules/access/services/auth.service.ts` ← `src/services/auth.ts`
- [ ] `modules/access/types/auth.ts` (+ Zod)

## Pré-requisitos (Onda 0)

Antes de preencher os esqueletos, garanta que a Onda 0 está feita:
- [ ] Route groups `app/(student)/` e `app/(admin)/` criados.
- [ ] `optimizePackageImports: ['lucide-react', 'recharts']` no `next.config.ts`.
- [ ] Ambiente de testes (Vitest + Testing Library + MSW) configurado.

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
