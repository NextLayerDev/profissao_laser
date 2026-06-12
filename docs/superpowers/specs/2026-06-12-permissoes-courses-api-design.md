# Migração de Cargos / Permissões / Acesso de Usuário para a Courses API

**Data:** 2026-06-12
**Status:** Aprovado (design) — pendente plano de implementação

## Contexto

O painel já tem o recurso de controle de acesso **totalmente construído** (CRUD de cargos,
matriz de permissões por usuário, derivação de _overrides_ por diff). Porém:

1. Toda a camada de dados aponta para o **gateway antigo** (`src/lib/fetch.ts` → `api`,
   sem prefixo `/v1`, com `id` numérico de cargo).
2. `usePermissions()` foi **deliberadamente stubado** no cutover da Courses API: hoje ele
   ignora o modelo granular e dá acesso total a qualquer `admin`/`staff` (deriva de `me.role`).
3. Não existe fluxo de atribuição de acesso por usuário (`PATCH /v1/user/:id/access`).

O backend agora serve o modelo granular na **Courses API** (`apiCourses`, prefixo `/v1`,
ids `uuid`, campos `snake_case`). Este documento descreve a migração do recurso para esse
contrato e a reativação do _gating_ granular.

## Decisões tomadas

- **Profundidade:** migração completa. Cargos passam a usar `role_id` uuid em todo lugar;
  listagem/CRUD de usuário passa para `modules/users` (`AppUser`); usa
  `PATCH /v1/user/:id/access`; a camada antiga (`use-roles`, `use-permissions`, `use-users`,
  `services/roles`, `types/roles`) é aposentada.
- **Pré-preenchimento do modal:** `GET /v1/user/:id/access` retorna o cargo atribuído e os
  overrides do usuário.
- **Localização:** nova camada de dados em `src/modules/access/` (padrão dos módulos da
  Courses API). Componentes de UID da página permanecem em `src/components/acessos/`.
- **Back-compat de gating:** `canPrice = can('produtos.price')`, `canAdmin = isSuperAdmin`.
- **Aba Utilizadores:** lista todos os usuários **não-`customer`** (staff + admin).

## Contrato da API (Courses API, `apiCourses`, prefixo `/v1`)

| Operação | Endpoint | Observações |
|---|---|---|
| Permissões do usuário logado | `GET /v1/me/permissions` | `{ isSuperAdmin: bool, permissions: string[] }` (camelCase, conforme spec) |
| Catálogo de módulos×ações | `GET /v1/permissions/catalog` | `[{ module, label, actions[] }]` |
| Listar cargos | `GET /v1/roles` | `id` = uuid |
| Criar cargo | `POST /v1/roles` | body `{ key, label, grants[], is_super_admin }` |
| Editar cargo | `PATCH /v1/role/:id` | id = uuid |
| Remover cargo | `DELETE /v1/role/:id` | bloqueado se em uso |
| Ler acesso do usuário | `GET /v1/user/:id/access` | `{ role_id: uuid\|null, overrides:{granted[],revoked[]} }` |
| Atribuir acesso | `PATCH /v1/user/:id/access` | body `{ role_id: uuid\|null, overrides?: {granted[],revoked[]} }` |

**Insulação de nomes:** o wire é misto (`key`, `is_super_admin`, `role_id`). Os tipos
internos permanecem camelCase; o mapeamento wire↔interno acontece **somente na fronteira do
service**, minimizando a mudança nos ~20 consumidores de `usePermissions()` e nos componentes.

Tipo interno `Role`: `{ id: string, key: string, label: string|null, grants: string[], isSuperAdmin: boolean }`.
Churn obrigatório: `role.role → role.key`; ids numéricos → string uuid.

## Arquitetura

### Nova camada de dados — `src/modules/access/`

```
src/modules/access/
  types/access.ts            roleSchema, permissionModuleSchema,
                             myPermissionsSchema, userAccessSchema, payloads
  services/access.service.ts todas as chamadas /v1 via apiCourses (mapeia wire↔interno)
  hooks/use-access.ts        usePermissions, useRoles, usePermissionCatalog, useUserAccess
  index.ts                   exports públicos
```

### `usePermissions` (reativado)

- Busca `GET /v1/me/permissions` (habilitado quando há token de usuário; super admin
  curto-circuita).
- `can(key) = isSuperAdmin || permissions.includes(key)`.
- Back-compat: `canPrice = can('produtos.price')`, `canAdmin = isSuperAdmin`.
- Mantém a assinatura atual (`can`, `canPrice`, `canAdmin`, `isSuperAdmin`, `permissions`,
  `isLoading`) para não quebrar consumidores.

### Página de Acessos (`src/app/acessos/page.tsx`)

- **Lista de usuários:** `modules/users` `listUsers` (`AppUser`, uuid), filtrando
  não-`customer`. Coluna "Cargo" mostra o papel granular quando disponível; como
  `GET /v1/users` traz só o enum coarse, `role_id`+overrides são buscados sob demanda.
- **Modal de edição:** `<select>` de cargo chaveado por uuid; pré-preenche via
  `useUserAccess(id)` (`GET /v1/user/:id/access`); ao salvar, calcula o diff de `overrides`
  (lógica existente) e chama `PATCH /v1/user/:id/access` com `{ role_id, overrides }`.
- **Aba de cargos / role-form-modal / permission-matrix:** troca id numérico → uuid,
  `role.role` → `role.key`. Lógica da matriz inalterada.
- **Modais de criar/excluir usuário:** re-apontados para `modules/users`.

### Aposentadoria

Remover após a migração: `src/hooks/use-roles.ts`, `src/hooks/use-permissions.ts`,
`src/hooks/use-users.ts`, `src/services/roles.ts`, `src/types/roles.ts`, e os caminhos de
CRUD de usuário do gateway antigo que ficarem órfãos (`services/users`,
`services/colaboradores` se não usados em outro lugar — **verificar antes de remover**).

## Fluxo de dados (ciclo de vida)

```
login → GET /v1/me/permissions → store (React Query) → gating local (can/canSeeNavItem)
admin → aba Acessos → GET /v1/roles + GET /v1/permissions/catalog
admin cria/edita cargo → POST/PATCH /v1/roles
admin edita usuário → GET /v1/user/:id/access (pré-preenche) → PATCH /v1/user/:id/access
usuário afetado → novo login / refetch para ver mudanças (sem tempo real)
```

## Tratamento de erros / pontos defensivos

- Shape do **GET de cargo** não totalmente especificado: parsear
  `{ id, key, label, grants, is_super_admin }` de forma tolerante e falhar alto via zod.
- `canPrice`/`canAdmin`: mapeamentos a confirmar com os consumidores reais.
- Sem tempo real: atribuir acesso invalida apenas o cache local; o usuário afetado precisa
  de novo login/refetch.
- 401: interceptor do `apiCourses` já trata (limpa tokens, redireciona a `/login`).

## Testes

- Services: parsing zod do wire (camel/snake), mapeamento de payload de criação de cargo.
- `usePermissions`: `can` com/sem `isSuperAdmin`; back-compat `canPrice`/`canAdmin`.
- Modal de edição: diff de overrides a partir do `GET /v1/user/:id/access` pré-carregado.

## Fora de escopo

- Atualização de permissões em tempo real.
- Refatorações não relacionadas à migração.
- Relocação dos componentes de `src/components/acessos/` para dentro do módulo.
