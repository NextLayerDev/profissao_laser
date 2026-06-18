# Arquitetura — Profissão Laser

> Documento oficial do padrão de organização do código. **Todo código novo segue
> este padrão.** PRs que criem código no formato legado (`src/services`,
> `src/hooks`, `src/types`, `src/components/<topico>`) devem ser ajustados antes do merge.

## Decisão: um repositório, separado por faces (route groups)

O sistema tem duas faces — **aluno** (curso, comunidade, vetorização, loja…) e
**admin** (cadastros, parâmetros, alunos, acessos, relatórios…) — mas elas são
**fortemente acopladas**: mesmo backend (`NEXT_PUBLIC_GATEWAY_URL`), mesma camada
de auth (`lib/auth.ts` modela `pl_user_token` = admin e `pl_customer_token` =
aluno), e compartilham planos, entitlements, cursos e biblioteca de vetores (o
admin cadastra o que o aluno consome).

Por isso **não dividimos em dois repositórios.** A separação é feita por
**route groups** do Next no mesmo app — fronteira clara, bundles separados por
rota (o aluno não baixa JS de admin) e zero duplicação de núcleo:

```
src/app/
  (student)/   course, comunity, vetorizacao, biblioteca-vetores, store, suporte, duvidas...
  (admin)/     sales, parametros, previas, alunos, acessos, reports, system-classes...
```

Cada grupo tem seu `layout.tsx` e seu guard de auth.

### Quando reavaliar (→ monorepo, nunca dois repos soltos)

Só evoluir para monorepo (`apps/student`, `apps/admin`, `packages/shared` com
Turborepo/pnpm) se **e quando** surgir uma destas necessidades concretas:

- times distintos donos de cada app;
- cadências de deploy realmente diferentes;
- exigência de isolar o admin (superfície de ataque / compliance).

A refatoração para módulos (abaixo) é o que torna esse split futuro barato — e é
pré-requisito de qualquer separação. Faça-a primeiro de qualquer forma.

---

## Padrão de referência (módulos)

O módulo **`src/modules/courses`** é a implementação de referência. Toda feature
vive dentro de um módulo de domínio:

```
src/modules/<dominio>/
  components/                 # views e sub-componentes do domínio
  hooks/                      # React Query hooks + query keys exportadas
  services/<x>.service.ts     # chamadas à API (parse com Zod)
  types/<x>.ts                # tipos + schemas Zod co-localizados
  index.ts                    # barrel: ÚNICO ponto de import público
```

As páginas em `app/(student|admin)/` são finas: fazem guard de auth e compõem
componentes vindos dos módulos via `@/modules/<dominio>`.

### Regras

1. **Import pelo barrel para a API leve; direto para o que é pesado.** Fora do
   módulo, importe tipos, hooks e services de `@/modules/<dominio>`. **Mas o
   barrel derruba tree-shaking** (regra Vercel `bundle-barrel-imports`, impacto
   CRÍTICO): se importar de `index.ts`, o bundler tende a arrastar tudo que o
   barrel reexporta. Por isso:
   - **Componentes pesados** (editor fabric, gráficos recharts, views grandes)
     são importados **por caminho direto** e via `next/dynamic` (ver regra 6),
     não pelo barrel.
   - Cada módulo migrado entra em `optimizePackageImports` no `next.config.ts`
     para o Next reescrever os imports de barrel em imports diretos.
   - Nunca alcance `services/`/`hooks/` internos de **outro** módulo direto — só
     o que o barrel expõe (a fronteira pública continua valendo).
2. **Services** usam o client compartilhado `@/shared/lib/api-courses`
   (`apiCourses`), nunca o legado `@/lib/fetch`. Toda resposta é validada com
   schema Zod (`schema.parse(data)`).
3. **Tipos + schemas Zod ficam juntos** em `types/`. Exporte tanto o `type`
   quanto o `schema`.
4. **Hooks** exportam a `queryKey` (`export const xQueryKey = [...] as const`),
   tratam erro com `getApiErrorMessage` (`@/shared/lib/api-error`) e feedback com
   `sonner`.
5. **Componentes** do módulo ficam em `components/`. Nenhum componente acima de
   **~350 linhas** — ao mover um monolito, quebre na mesma PR.
6. **Carregamento sob demanda**: componentes pesados ou só-cliente (editor
   fabric `canva`/`canva-editor`, gráficos `recharts`, modais/abas grandes)
   entram com `next/dynamic`. Não confie só no React Compiler para bundle —
   ele otimiza re-render, não o tamanho do bundle.
7. **Páginas preferem Server Component.** A página em `app/(student|admin)/`
   busca dados no servidor e usa `<Suspense>` para streamar; só as ilhas
   interativas levam `'use client'`. A conversão para RSC acontece **na mesma PR
   da migração do módulo** (não é trabalho adiado — ver Ondas).

### Exemplo de service (padrão)

```ts
import { apiCourses as api } from '@/shared/lib/api-courses';
import { type Course, courseSchema } from '../types/courses';

export async function listAdminCourses(): Promise<Course[]> {
  const { data } = await api.get('/v1/admin/courses');
  return courseSchema.array().parse(data);
}
```

---

## Migração do legado

Estrutura legada (em processo de extinção) → módulo de destino e face:

| Módulo de destino | Face | Services legados a absorver |
|---|---|---|
| `subscriptions` (existe) | aluno/admin | subscription, my-subscription, addons, entitlements, provisioning, purchase |
| `courses` (existe) | aluno/admin | course, courses-auth, classes, system-classes, quiz, progress, saved-lessons, modules |
| `plans` (existe) | admin | landing-plans |
| `catalog` (existe) | aluno | products |
| `access` (existe) | admin | auth |
| `users` / `account` (existem) | admin/aluno | users, customer, profile, credits |
| `tools` (existe) | aluno | gravacao-oneclick, wa-group |
| **`community`** (novo) | aluno | community, forum, presence, ratings, gamification |
| **`vectors`** (novo) | aluno | vector-library, vectorize, vectorize-help, vector-support, vectors, designs, editor-ai, templates |
| **`parameters`** (novo) | admin | parameters, product-parameters, laser-products, laser-line-types, machines, materials, previas |
| **`students`** (novo) | admin | students, colaboradores |
| **`support`** (novo) | aluno/admin | doubts, doubt-chat, faq, knowledge-base, support-chat, appointment-config, appointments |
| **`sales`** (novo) | admin | sales, coupons, promo-links, plan-links, payment-links, global-promo-links |

### Receita por módulo (repetir igual)

1. Criar/abrir `modules/<dominio>/` com a estrutura padrão.
2. Mover service → `services/<x>.service.ts`; trocar `@/lib/fetch` por `@/shared/lib/api-courses`.
3. Mover tipos de `src/types/<x>.ts` → `types/<x>.ts` e **adicionar schema Zod**.
4. Mover hooks React Query relacionados; exportar a `queryKey`.
5. Mover componentes de `src/components/<topico>/` → `components/` (quebrando monolitos).
6. Escrever/atualizar o `index.ts` barrel.
7. Atualizar imports dos consumidores para `@/modules/<dominio>`.
8. Mover a página para a face correta: `app/(student)/` ou `app/(admin)/` e,
   **na mesma PR, convertê-la para Server Component**: dados no servidor +
   `<Suspense>` para a parte que carrega; `'use client'` só nas ilhas interativas
   (regra Vercel `async-suspense-boundaries`).
9. Adicionar o módulo a `optimizePackageImports` no `next.config.ts` e trocar os
   componentes pesados por `next/dynamic`.
10. **Escrever testes** (ver seção "Testes"): service/hook com MSW + teste de
    interface da view migrada.
11. Deletar os arquivos legados.
12. `npx biome check --write` + build limpo + testes passando.
13. **1 PR por módulo.**

---

## Quebra de componentes-monolito

Vários "views" cresceram além do sustentável. Eles são quebrados **na mesma PR
da migração do módulo** ao qual pertencem (não em PR separada). Meta: nenhum
componente acima de **~350 linhas**.

### Inventário (baseline 2026-06-18)

| Componente | Linhas | Módulo / face | Onda |
|---|---:|---|---|
| `components/community/community-view.tsx` | 2417 | community / aluno | 2 |
| `components/previas/previas-view.tsx` | 2007 | parameters / admin | 3 |
| `components/vetorizacao/vetorizacao-view.tsx` | 1707 | vectors / aluno | 2 |
| `app/global-promo-link/[token]/page.tsx` | 1254 | sales / admin | 2 |
| `components/gravacao-oneclick/gravacao-oneclick-view.tsx` | 1229 | tools / aluno | 3 |
| `components/alunos/student-detail-view.tsx` | 1208 | students / admin | 3 |
| `components/products/community-section.tsx` | 1167 | community / admin | 2 |
| `components/community/vector-library-admin-section.tsx` | 1163 | vectors / admin | 2 |
| `components/parametros/parametros-admin-view.tsx` | 1084 | parameters / admin | 3 |
| `components/fatura/fatura-view.tsx` | 1079 | subscriptions / aluno | 3 |
| `components/suporte/suporte-online-view.tsx` | 1066 | support / aluno | 3 |
| `components/products/course-content-section.tsx` | 1023 | courses / admin | 1 |
| `components/biblioteca/biblioteca-vetores-view.tsx` | 1008 | vectors / aluno | 2 |

> Atualizar a métrica: `find src -name "*.tsx" | xargs wc -l | sort -rn | head`.

### Como quebrar (receita)

1. **Separar dados de apresentação**: extrair toda chamada a service/`useEffect`
   para hooks em `modules/<x>/hooks/`. O componente deixa de buscar dados — só
   recebe via hook/props.
2. **Uma seção = um arquivo**: cada aba, painel ou bloco visual vira um
   sub-componente em `modules/<x>/components/`. A view raiz passa a só compor.
3. **Isolar estado local**: agrupar `useState` relacionados em hooks dedicados
   (ex.: `useCommunityFilters`) em vez de dezenas de `useState` soltos na view.
4. **Extrair listas/cards repetidos** em componentes próprios. Com o React
   Compiler ligado, evite `memo`/`useMemo` manuais — só adicione se o profiler
   apontar (regra Vercel `rerender-simple-expression-in-memo`).
5. **Carregar pesado sob demanda**: editor fabric, gráficos recharts e
   modais/abas grandes entram via `next/dynamic` em vez de import estático
   (regra Vercel `bundle-dynamic-imports`).
6. **Sem mudança de comportamento**: a quebra é refactor puro. Cobrir com teste
   de interface (ver seção "Testes") e/ou verificar a tela manualmente
   antes/depois.

---

## Ordem de prioridade

Critério: **alto valor × baixo risco primeiro**.

**Onda 0 — fronteira de faces + wins de bundle (rápido, habilita o resto)**
- Criar route groups `app/(student)/` e `app/(admin)/` com `layout.tsx` + guard
  por grupo. Mover as rotas existentes para o grupo correto.
- Resolver o conflito de nomes **`app/comunity` (aluno)** vs **`app/community`
  (admin)** ao mover.
- **Habilitar `optimizePackageImports`** no `next.config.ts` (~5 min, impacto
  CRÍTICO — regra Vercel `bundle-barrel-imports`). O projeto usa `lucide-react`
  e `recharts` pesados sem essa config:
  ```ts
  experimental: { optimizePackageImports: ['lucide-react', 'recharts'] }
  ```
  Acrescente cada `@/modules/<dominio>` aqui conforme forem migrados.
- **Configurar o ambiente de testes** (Vitest + Testing Library) — ver seção
  "Testes" — para que as ondas seguintes já nasçam com cobertura.

**Onda 1 — consolidar o que já é módulo** (sem criar pastas novas)
1. `subscriptions` ← subscription, my-subscription, addons, entitlements, provisioning, purchase
2. `courses` ← course, classes, quiz, progress, saved-lessons
3. `plans` ← landing-plans · `catalog` ← products · `access` ← auth

**Onda 2 — domínios novos de baixo acoplamento**
4. `vectors`
5. `community` (quebrar `community-view.tsx`, 2417 linhas)
6. `sales`

**Onda 3 — domínios médios e monolitos restantes**
7. `support`
8. `parameters` (quebrar `previas-view.tsx` 2007, `parametros-admin-view.tsx` 1084)
9. `students` (quebrar `student-detail-view.tsx`, 1208)
10. `tools` ← gravacao-oneclick (quebrar `gravacao-oneclick-view.tsx`, 1229) + wa-group

**Onda 4 — fundações transversais** (em paralelo)
11. Cobrir com testes `lib/auth.ts`, `subscriptions`/`entitlements` antes de
    mexer (a infra de testes já vem da Onda 0).
12. Avaliar tokens em cookie `httpOnly` no lugar de `localStorage`.

> A conversão para Server Components **não é uma onda separada**: acontece dentro
> de cada migração (passo 8 da receita). Hoje 68/71 páginas são `'use client'`.

O acompanhamento detalhado da Onda 1 está em [`MIGRATION.md`](./MIGRATION.md).

---

## Testes

Hoje o projeto tem **0 testes**. A meta não é cobertura total — é uma rede de
segurança onde o custo de quebrar é alto, crescendo junto da migração (todo
módulo migrado nasce com teste; ao quebrar um monolito, o teste de interface
garante que o comportamento não mudou).

### Stack

- **Vitest** + **@testing-library/react** + **@testing-library/user-event** —
  testes de unidade e de interface (DOM via `jsdom`/`happy-dom`).
- **MSW (Mock Service Worker)** — intercepta as chamadas do `apiCourses` para
  testar componentes/hooks sem backend real.
- **Playwright** (opcional, fase posterior) — E2E dos fluxos críticos ponta a
  ponta (login → comprar plano → acessar curso).

Configurar na **Onda 0**. Convenção: teste ao lado do arquivo
(`x.test.ts` / `x.test.tsx`) dentro do próprio módulo.

### O que testar (em ordem de prioridade)

1. **Lógica crítica (unidade)**: `lib/auth.ts`, `subscriptions`/`entitlements`,
   schemas Zod e funções de `lib/` (cpf, format). Barato e alto retorno.
2. **Hooks de dados**: cada hook React Query com MSW — estados de
   loading/erro/sucesso e invalidação de `queryKey`.
3. **Testes de interface (componentes)**: comportamento observável pelo usuário,
   não detalhe de implementação. Para cada view migrada/quebrada, cobrir:
   - renderiza os dados retornados pelo service (mock MSW);
   - interações principais (clicar aba, enviar formulário, abrir modal) levam ao
     resultado esperado;
   - estados de carregando, vazio e erro aparecem corretamente;
   - gating por papel/feature (aluno vs admin, plano sem acesso) esconde/mostra
     o que deve.
4. **E2E (Playwright)**: só os fluxos que geram receita ou bloqueiam o usuário —
   login, checkout/assinatura, acesso a aula.

### Boas práticas

- Consultar por **papel/acessibilidade** (`getByRole`, `getByLabelText`), não por
  `testId` ou classe CSS — o teste sobrevive a refactor visual.
- Simular o usuário com `userEvent`, não disparar handlers direto.
- **Um comportamento por teste**; nome descreve o efeito esperado.
- Componentes só-cliente pesados (editor fabric) — testar a borda
  (monta/desmonta, props), não o canvas interno; deixar o miolo para E2E.
- Rodar no CI (GitHub Actions) e no `pre-commit` via `lint-staged` nos arquivos
  tocados.

### Definição de pronto (por módulo migrado)

- [ ] Service/hook do módulo com teste (MSW) cobrindo sucesso + erro.
- [ ] View principal com teste de interface (render + 1 interação + estado de erro).
- [ ] Monolito quebrado: teste garante comportamento idêntico ao anterior.

---

## Estilo (Tailwind CSS v4)

O projeto usa **Tailwind v4** com configuração **CSS-first**. Não existe (e não
deve voltar a existir) `tailwind.config.js`/`.ts`. Todo código novo segue as
convenções da v4:

- **Tema só em CSS, via `@theme`** em `src/app/globals.css`. Tokens de design
  (cores, fontes, sombras, animações) são variáveis CSS — ex.: `--color-*`,
  `--font-*`, `--shadow-*`, `--animate-*` — e viram utilitários automaticamente
  (`bg-workshop-accent`, `font-display`, `shadow-brand`). **Não** crie escala de
  cor/spacing em arquivo de config JS.
- **Entrada com `@import "tailwindcss"`** (não as antigas `@tailwind base/
  components/utilities`).
- **Variants customizadas com `@custom-variant`** (ex.: o `dark` já definido).
  Plugins/utilitários customizados com `@plugin` / `@utility`, não via
  `plugins: []` de config JS.
- **Use os tokens do tema**, não valores mágicos. Prefira `bg-workshop-card` a
  `bg-[#fff]`/`bg-white` solto; só use *arbitrary values* (`w-[37px]`) quando não
  houver token — se repetir, vira token no `@theme`.
- **Sintaxe v4 nas classes**: gradientes com `bg-linear-to-*` (não
  `bg-gradient-to-*`), opacidade com a barra (`bg-black/50`), e variáveis CSS
  diretas em arbitrary values quando preciso (`bg-(--color-workshop-bg)`).
- **PostCSS** via `@tailwindcss/postcss` (já configurado em `postcss.config.mjs`);
  nada de `postcss-import`/`autoprefixer` manual para o Tailwind.

Ao migrar um componente legado para um módulo, **atualize classes da v3 para a
v4** que aparecerem no caminho (ex.: `bg-gradient-to-r` → `bg-linear-to-r`) e
troque cores hard-coded por tokens do `@theme`.

---

## Métrica de progresso

Acompanhe a queda dos imports legados e a subida dos imports de módulo:

```sh
# legado (meta: → 0)
grep -rho "@/services\|@/hooks\|@/types" src --include="*.ts" --include="*.tsx" | wc -l
# módulos (meta: ↑)
grep -rho "@/modules" src --include="*.ts" --include="*.tsx" | wc -l
```

Baseline (2026-06-18): legado ≈ 680 · módulos ≈ 81.
