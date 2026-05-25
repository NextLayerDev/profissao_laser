# Refatoração para arquitetura de módulos + migração para upvox-api v1

**Data:** 2026-05-25
**Status:** Design aprovado, aguardando plano de implementação
**Escopo:** Refatoração estrutural do front + migração dos domínios que já têm API v1

## 1. Motivação

A estrutura atual organiza o código por **camada** (`src/services/`, `src/hooks/`, `src/types/`, `src/components/<dominio>/`, `src/contexts/`), o que dispersa um mesmo domínio em 4+ pastas e dificulta entender o módulo como um todo. Em paralelo, a nova `upvox-api` v1 introduz contratos diferentes para os domínios principais (auth unificado, `/me` para resolver role, endpoints renomeados/consolidados). Esta refatoração:

1. Consolida cada domínio em `src/modules/<nome>/` com fronteira clara via barrel `index.ts`.
2. Aproveita a movimentação para já adaptar os domínios cobertos pela nova API.
3. Aplica route groups do Next.js (`(admin)`, `(customer)`, `(public)`) para isolar layouts e fluxos de acesso.

## 2. Estrutura alvo

### 2.1 Layout de um módulo

```
src/modules/<nome>/
├── index.ts          # barrel — única superfície pública do módulo
├── components/       # componentes específicos do domínio
├── hooks/            # react-query hooks (queries + mutations)
├── services/         # funções que falam com a API (axios + zod parse)
└── types/            # zod schemas + tipos inferidos (sem schemas separados)
```

**Regras de fronteira:**

- Outros módulos importam **apenas via barrel**: `import { useLogin } from '@/modules/auth'`. Imports profundos (`@/modules/auth/hooks/use-login`) são proibidos.
- Páginas em `src/app/` ficam *thin*: importam do barrel do módulo e renderizam. Não contêm lógica de domínio.
- Schemas Zod + tipos inferidos coabitam em `types/` (sem pasta `schemas/` separada).

### 2.2 Camada compartilhada (`src/shared/`)

```
src/shared/
├── lib/
│   ├── fetch.ts          # axios + interceptor (token único)
│   ├── auth.ts           # storage do token (sem distinção de role)
│   ├── db.ts             # supabase client
│   └── internal-api.ts
├── utils/                # apenas genéricos
│   ├── format-currency.ts
│   ├── formatDate.ts
│   ├── dateRange.ts
│   ├── title-case.ts
│   └── test-record-detector.ts
├── components/
│   ├── ui/               # shadcn-style (access-gate, empty-state, loading-state, ...)
│   └── theme-toggle.tsx
├── contexts/
│   └── theme-context.tsx
└── providers.tsx
```

Tudo que é específico de domínio sai de `src/utils/` / `src/lib/` para o módulo correspondente quando esse módulo é migrado. Itens cujo módulo ainda não tem API v1 (sales, community, vector-library, agendamentos, products, etc.) permanecem em `src/utils/` até a migração do respectivo módulo.

### 2.3 Route groups em `src/app/`

```
src/app/
├── (admin)/              # layout admin (sidebar) + guard de role
│   ├── layout.tsx
│   ├── dashboard/
│   ├── acessos/
│   ├── parametros/
│   ├── sales/
│   ├── alunos/
│   ├── duvidas-admin/
│   ├── vetorizacao-admin/
│   ├── previas-admin/
│   └── system-classes/
├── (customer)/           # layout customer
│   ├── layout.tsx
│   ├── course/
│   ├── store/
│   ├── community/
│   ├── jornada/
│   ├── biblioteca-vetores/
│   └── agendamentos/
├── (public)/             # rotas abertas
│   ├── login/            # form único — sem /login/admin
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
├── api/                  # rotas internas Next.js (sem mudança)
└── layout.tsx
```

URLs **não mudam** — route groups não aparecem na URL. Ganhos: layouts isolados por audiência e guardas por grupo.

## 3. Mapa de módulos (escopo desta refatoração)

Apenas domínios cobertos pela `upvox-api` v1 são migrados nesta rodada. Demais (sales, forum, community, vectorize, parametros, agendamentos, doubts, designs, previas, materials, machines, addons, coupons, faq, gamification, knowledge-base, etc.) ficam intactos até suas APIs aparecerem.

| Módulo | Endpoints v1 | Substitui no front atual |
|---|---|---|
| `auth` | `/v1/auth/{signup,login,forgot-password,reset-password}` | services/auth, hooks/use-auth, types/auth, components/auth, app/{login,register,forgot-password,reset-password} |
| `me` | `GET\|PATCH /v1/me`, `GET /v1/me/subscriptions` | partes de use-customer, use-my-subscription |
| `catalog` (público) | `/v1/courses`, `/v1/course/{slug}`, `/v1/course/{slug}/plans` | landing/store, parte de use-course |
| `courses` (admin) | `/v1/admin/courses`, `POST\|PATCH\|DELETE /v1/course[/{id}]` | services/course, hooks/use-course, components/course |
| `course-modules` | `/v1/course/{slug}/modules`, `/v1/module/*` | services/modules, hooks/modules |
| `lessons` | `/v1/module/{id}/lessons`, `/v1/lesson/*` | services/course (parte), saved-lessons |
| `quizzes` | `/v1/lesson/{id}/quiz`, attempts | services/quiz, hooks/use-quiz |
| `plans` (admin) | `/v1/plans`, `/v1/plan/*` | services/plans, use-customer-plans |
| `plan-tools` | `/v1/plan/{id}/tools` | (novo) |
| `course-plans` | `/v1/course/{slug}/plan/{planKey}` | (novo) |
| `tools` (admin) | `/v1/tools`, `/v1/tool/*` | (novo) |
| `users` (admin) | `/v1/users`, `/v1/user/{id}`, `PATCH /v1/user/{id}/role` | services/users, app/acessos |
| `subscriptions` | `POST /v1/subscription`, upgrade/downgrade | services/subscription, services/my-subscription, app/assinatura |

## 4. Mudanças de contrato e plumbing do auth

### 4.1 Token storage (`src/shared/lib/auth.ts`)

**Hoje:** duas chaves no localStorage — `pl_customer_token` e `pl_user_token`. `getActiveToken()` prioriza user > customer. `isAdmin()` = `!!getToken('user')`.

**Depois:** uma única chave `pl_token`. API:

```ts
saveToken(token: string): void
getToken(): string | null
clearToken(): void
getCurrentUser(): JwtPayload | null   // decode + valida exp (mantém)
```

`isAdmin()` síncrono deixa de existir; a role passa a vir de `useMe()` (cache react-query do `GET /v1/me`).

### 4.2 AuthGuard / role gating

- `src/components/auth-guard.tsx` move para `src/modules/auth/components/auth-guard.tsx`.
- Determina autenticação por `getCurrentUser()` (JWT válido).
- Determina role chamando `useMe()` — se o cache estiver vazio, dispara a query e aguarda.
- Redirecionamentos:
  - Não autenticado → `/login`.
  - Customer em rota `(admin)` → `/store`.
  - Admin em rota `(customer)` → `/dashboard`.
- Layouts em `(admin)/layout.tsx` e `(customer)/layout.tsx` aplicam o guard com o role exigido.

### 4.3 Fluxo de login unificado

- `app/(public)/login/page.tsx` — form único `{ email, password }`.
- `useLogin()` chama `POST /v1/auth/login`, salva o token, chama `useMe()` e redireciona com base em `me.role`:
  - role customer → `/course`
  - role admin/staff → `/dashboard`
- `app/login/admin/page.tsx` é removido.

### 4.4 Signup unificado

- `POST /v1/auth/signup` recebe `{ email, password, phone, name }`.
- Registro admin é feito por outro fluxo (admin convida via `/acessos`) — o form público só registra customer.

### 4.5 Reset password

- `POST /v1/auth/reset-password` com `{ access_token, new_password }` (renomear do contrato antigo).

### 4.6 Interceptor axios (`src/shared/lib/fetch.ts`)

- Injeta `Authorization: Bearer ${getToken()}` (sem distinção de role).
- Em 401: limpa token único e redireciona para `/login`.

## 5. Estratégia de migração

### 5.1 Estratégia geral

- **Incremental, um módulo por PR.** Main fica estável; cada PR é reviewável e revertível.
- Módulo `auth` é o piloto — valida o padrão de pastas, barrel, e a migração da semântica.
- Depois do piloto, ordem sugerida (cada um vira PR separado):
  `me` → `users` (admin) → `plans` → `subscriptions` → `catalog` → `courses` → `course-modules` → `lessons` → `quizzes` → `tools` → `plan-tools` → `course-plans`.

Razão da ordem: `me` desbloqueia o login do piloto; tabulares e independentes (`users`, `plans`, `subscriptions`) primeiro; cadeia de conteúdo (`catalog` → `courses` → `course-modules` → `lessons` → `quizzes`) na sequência; admin-glue (`tools`, `plan-tools`, `course-plans`) no fim.

### 5.2 Template aplicável a cada módulo

1. Criar `src/modules/<nome>/` com a estrutura padrão.
2. Portar `types/` (atualizar schemas Zod para o contrato v1).
3. Portar `services/` (novos endpoints, validar response com `schema.parse(data)`).
4. Portar `hooks/` (react-query, chaves padronizadas: `['<modulo>', ...]`).
5. Mover componentes específicos do domínio.
6. Criar `index.ts` (barrel) — exporta apenas a API pública.
7. Atualizar páginas em `src/app/` para importar via barrel.
8. Mover páginas para o route group correto (`(admin)` / `(customer)` / `(public)`).
9. Deletar arquivos antigos (`src/services/<x>.ts`, etc.) **só depois de zero referências** (grep).
10. Smoke test: `npm run build` + `npm run lint` + fluxo principal na UI em `npm run dev`.

### 5.3 Piloto: `auth`

Estado final:

```
src/modules/auth/
├── index.ts
├── components/
│   ├── auth-guard.tsx              # movido de src/components/
│   └── change-password-modal.tsx
├── hooks/
│   ├── use-signup.ts               # POST /v1/auth/signup
│   ├── use-login.ts                # POST /v1/auth/login + redireciona via me.role
│   ├── use-forgot-password.ts
│   └── use-reset-password.ts
├── services/
│   └── auth.service.ts
└── types/
    └── auth.ts
```

API pública (`index.ts`):

```ts
export { AuthGuard } from './components/auth-guard'
export { ChangePasswordModal } from './components/change-password-modal'
export { useLogin, useSignup, useForgotPassword, useResetPassword } from './hooks/...'
export type { LoginPayload, SignupPayload, AuthTokenResponse } from './types/auth'
```

Mudanças além do mover:

- Unificar `registerCustomer`/`registerUser` → `signup`.
- Unificar `loginCustomer`/`loginUser` → `login`.
- `resetPassword(token, newPassword)` → `resetPassword({ access_token, new_password })`.
- `src/shared/lib/auth.ts`: token único (`pl_token`), API sem param de role.
- Páginas afetadas: `app/(public)/{login,register,forgot-password,reset-password}/page.tsx`. Remover `app/login/admin/`.

Hotspots a verificar no PR do piloto (apontados na auditoria):

- `src/components/store/user-badge.tsx` (logout)
- `src/hooks/use-permissions.ts`
- `src/components/course/saved-lessons-modal.tsx`
- `src/app/course/.../vitrine/page.tsx`
- `src/lib/fetch.ts` (interceptor — vira `src/shared/lib/fetch.ts`)
- Os 25 pages que chamam `getCurrentUser()` continuam funcionando (JWT decode permanece).
- Os 7 components + 4 hooks que chamam `getToken('user'|'customer')` precisam migrar para `useIsAdmin()` (React) ou `getToken()` puro (não-React).

## 6. Tratamento de erros e validação

- Toda response de service passa por `schema.parse(data)`. Falha de parse propaga como erro tipado para o react-query.
- Mutations usam `sonner` (já no projeto) para toast de sucesso/erro com mensagem do backend.
- 401 continua tratado no interceptor (limpa token único, redireciona para `/login`).

## 7. Testes

Não há suite de testes automatizados no projeto. Cada PR de módulo passa por smoke manual:

- `npm run build` (type-check global)
- `npm run lint` (biome)
- Fluxo principal na UI no `npm run dev`

Adicionar Vitest + RTL é uma evolução futura, **fora do escopo desta refatoração**.

## 8. Fora de escopo

- Módulos sem API v1 (sales, forum, community, vectorize, parametros, agendamentos, doubts, designs, previas, materials, machines, addons, coupons, faq, gamification, knowledge-base, vector-library, etc.) ficam onde estão.
- Adição de testes automatizados.
- Refatoração de `src/utils/constants/*` (avaliação caso a caso será feita na migração do módulo correspondente).
- Mudanças em `src/app/api/` (rotas Next.js internas).
- Webhooks (`POST /v1/webhook/stripe`) — backend-only.

## 9. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| 54 arquivos importam `@/lib/auth` — PR do piloto fica grande | Manter o caminho `@/shared/lib/auth.ts` com a mesma superfície que importa; atualizar imports em sweep. Refazer apenas as 11 chamadas que dependem da distinção customer/user. |
| Quebra de login enquanto `me` não está pronto | `me` é o segundo módulo migrado, logo após `auth`. No piloto, criar `useMe()` mínimo dentro do próprio módulo `auth` (depois move para `modules/me/`). |
| Layouts admin/customer atuais bagunçam ao mover para route groups | Mover páginas em uma única passada e validar visualmente cada layout. Manter `admin-layout-wrapper.tsx` como base do `(admin)/layout.tsx`. |
| Importação profunda escapa do barrel | Configurar regra do Biome proibindo `@/modules/*/!(index)` em PR de seguimento (fora do piloto). |
