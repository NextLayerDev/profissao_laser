# Migração de Permissões/Cargos/Acesso para a Courses API — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reativar o controle de acesso granular do painel migrando cargos, permissões e atribuição de acesso por usuário do gateway antigo para a Courses API (`apiCourses`, `/v1`, ids uuid).

**Architecture:** Nova camada de dados em `src/modules/access/` (types→service→hooks) que fala com a Courses API e mapeia o contrato _wire_ (`key`, `is_super_admin`, `role_id`, snake_case) para tipos internos camelCase. `usePermissions` deixa de ser um stub e passa a consumir `GET /v1/me/permissions`. A página de Acessos passa a listar usuários via `modules/users` e a editar acesso via `GET/PATCH /v1/user/:id/access`. A camada antiga de cargos é aposentada; o diretório de usuários legado permanece (é compartilhado por outras features).

**Tech Stack:** Next.js 16, React 19, TanStack Query v5, axios (`apiCourses`), zod v4, biome.

> **Verificação:** este repositório **não tem framework de testes** (sem vitest/jest). Os portões de verificação deste plano são **typecheck** (`npx tsc --noEmit`), **lint** (`npx @biomejs/biome check`) e **QA manual** descrito ao final. Não introduza um test runner — está fora de escopo.

> **Commits:** por política do repositório, commits são iniciados pelo usuário. Não commitar automaticamente; ver a seção final.

---

## Decisões de escopo (confirmadas)

- **Cargos:** migração completa para Courses API (ids uuid). Camada antiga aposentada.
- **Lista de usuários (aba Utilizadores):** passa a usar `modules/users` `listUsers` (`AppUser`), filtrando não-`customer`.
- **Criar/excluir usuário:** permanecem no caminho legado (Courses API não expõe esses endpoints).
- **Editar usuário:** vira **somente acesso** (cargo + overrides) via `GET/PATCH /v1/user/:id/access`; nome/e-mail ficam **somente leitura** (não há endpoint Courses para editar perfil de terceiros).
- **Coluna "Cargo" na lista:** mostra "—" (cargo granular é carregado/editado só no modal).
- **Gating back-compat:** `canPrice = produtos.price`, `canAdmin = isSuperAdmin`.

## Mapa de arquivos

**Criar:**
- `src/modules/access/types/access.ts` — schemas/tipos (Role, PermissionModule, MyPermissions, UserAccess, payloads).
- `src/modules/access/services/access.service.ts` — chamadas `/v1` + mapeamento wire↔interno.
- `src/modules/access/hooks/use-access.ts` — `usePermissions`, `useRoles`, `usePermissionCatalog`, `useUserAccess`.
- `src/modules/access/index.ts` — exports públicos.

**Modificar:**
- `src/utils/constants/permissions.ts` — importar `PermissionModule` de `@/modules/access`.
- `src/components/acessos/permission-matrix.tsx` — tipo de `@/modules/access`.
- `src/components/acessos/role-form-modal.tsx` — tipos/uuid/`role.key`.
- `src/components/acessos/roles-tab.tsx` — hooks/tipos novos, uuid.
- `src/components/acessos/edit-user-modal.tsx` — `AppUser` + `useUserAccess` + `updateUserAccess` (access-only).
- `src/components/acessos/create-user-modal.tsx` — remover seleção numérica de `Permissions`.
- `src/components/acessos/delete-user-modal.tsx` — tipar por `AppUser`.
- `src/app/acessos/page.tsx` — lista via `modules/users`, hooks novos, uuid.
- Os ~20 consumidores de `@/hooks/use-permissions` — repointar import para `@/modules/access`.

**Remover (Task 10, após typecheck verde):**
- `src/hooks/use-permissions.ts`, `src/hooks/use-roles.ts`, `src/services/roles.ts`, `src/types/roles.ts`, `src/utils/constants/roles.ts`.

**NÃO remover** (diretório de usuários legado, compartilhado): `src/hooks/use-users.ts`, `src/types/users.ts`, `src/services/users.ts`, `src/services/colaboradores.ts`.

---

### Task 1: Tipos do módulo access

**Files:**
- Create: `src/modules/access/types/access.ts`

- [ ] **Step 1: Escrever os schemas/tipos**

```typescript
import { z } from 'zod';

// ── Catálogo de módulos × ações ───────────────────────────────
export const permissionModuleSchema = z.object({
	module: z.string(),
	label: z.string(),
	actions: z.array(z.string()),
});
export type PermissionModule = z.infer<typeof permissionModuleSchema>;

// ── Cargo (wire snake_case → interno camelCase) ───────────────
const roleWireSchema = z.object({
	id: z.string(),
	key: z.string(),
	label: z.string().nullable().optional(),
	grants: z.array(z.string()).default([]),
	is_super_admin: z.boolean().default(false),
});
export const roleSchema = roleWireSchema.transform((r) => ({
	id: r.id,
	key: r.key,
	label: r.label ?? null,
	grants: r.grants,
	isSuperAdmin: r.is_super_admin,
}));
export type Role = z.infer<typeof roleSchema>;

export interface RolePayload {
	key: string;
	label?: string;
	grants: string[];
	isSuperAdmin: boolean;
}

// ── Permissões efetivas do usuário logado ─────────────────────
export const myPermissionsSchema = z.object({
	isSuperAdmin: z.boolean(),
	permissions: z.array(z.string()),
});
export type MyPermissions = z.infer<typeof myPermissionsSchema>;

// ── Acesso de um usuário (cargo + exceções) ───────────────────
export const userOverridesSchema = z.object({
	granted: z.array(z.string()).default([]),
	revoked: z.array(z.string()).default([]),
});
export type UserOverrides = z.infer<typeof userOverridesSchema>;

const userAccessWireSchema = z.object({
	role_id: z.string().nullable(),
	overrides: userOverridesSchema.default({ granted: [], revoked: [] }),
});
export const userAccessSchema = userAccessWireSchema.transform((a) => ({
	roleId: a.role_id,
	overrides: a.overrides,
}));
export type UserAccess = z.infer<typeof userAccessSchema>;

export interface UserAccessPayload {
	roleId: string | null;
	overrides?: UserOverrides;
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos referentes a este arquivo (consumidores ainda não existem).

---

### Task 2: Service do módulo access

**Files:**
- Create: `src/modules/access/services/access.service.ts`

- [ ] **Step 1: Escrever o service**

```typescript
import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type MyPermissions,
	myPermissionsSchema,
	type PermissionModule,
	permissionModuleSchema,
	type Role,
	type RolePayload,
	roleSchema,
	type UserAccess,
	type UserAccessPayload,
	userAccessSchema,
} from '../types/access';

/** Permissões efetivas do usuário logado (base do gating). */
export async function getMyPermissions(): Promise<MyPermissions> {
	const { data } = await api.get('/v1/me/permissions');
	return myPermissionsSchema.parse(data);
}

/** Catálogo de módulos×ações (para a matriz de configuração). */
export async function getPermissionCatalog(): Promise<PermissionModule[]> {
	const { data } = await api.get('/v1/permissions/catalog');
	return permissionModuleSchema.array().parse(data);
}

export async function getRoles(): Promise<Role[]> {
	const { data } = await api.get('/v1/roles');
	return roleSchema.array().parse(data);
}

function toRoleWire(p: Partial<RolePayload>) {
	return {
		...(p.key !== undefined ? { key: p.key } : {}),
		...(p.label !== undefined ? { label: p.label } : {}),
		...(p.grants !== undefined ? { grants: p.grants } : {}),
		...(p.isSuperAdmin !== undefined
			? { is_super_admin: p.isSuperAdmin }
			: {}),
	};
}

export async function createRole(payload: RolePayload): Promise<Role> {
	const { data } = await api.post('/v1/roles', toRoleWire(payload));
	return roleSchema.parse(data);
}

export async function updateRole(
	id: string,
	payload: Partial<RolePayload>,
): Promise<Role> {
	const { data } = await api.patch(`/v1/role/${id}`, toRoleWire(payload));
	return roleSchema.parse(data);
}

export async function deleteRole(id: string): Promise<void> {
	await api.delete(`/v1/role/${id}`);
}

/** Cargo atribuído + overrides de um usuário (pré-preenche o modal). */
export async function getUserAccess(userId: string): Promise<UserAccess> {
	const { data } = await api.get(`/v1/user/${userId}/access`);
	return userAccessSchema.parse(data);
}

export async function updateUserAccess(
	userId: string,
	payload: UserAccessPayload,
): Promise<void> {
	await api.patch(`/v1/user/${userId}/access`, {
		role_id: payload.roleId,
		...(payload.overrides ? { overrides: payload.overrides } : {}),
	});
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos referentes a este arquivo.

---

### Task 3: Hooks do módulo access + index

**Files:**
- Create: `src/modules/access/hooks/use-access.ts`
- Create: `src/modules/access/index.ts`

- [ ] **Step 1: Escrever os hooks**

`src/modules/access/hooks/use-access.ts`:

```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { getToken } from '@/lib/auth';
import {
	createRole,
	deleteRole,
	getMyPermissions,
	getPermissionCatalog,
	getRoles,
	getUserAccess,
	updateRole,
	updateUserAccess,
} from '../services/access.service';
import type { RolePayload, UserAccessPayload } from '../types/access';

/**
 * Permissões efetivas do usuário logado, vindas de `GET /v1/me/permissions`.
 * Mantém a assinatura usada pelos consumidores (`can`, `canPrice`, `canAdmin`,
 * `isSuperAdmin`, `permissions`, `isLoading`).
 */
export function usePermissions() {
	const hasUserToken = !!getToken('user');

	const { data, isLoading } = useQuery({
		queryKey: ['me-permissions'],
		queryFn: getMyPermissions,
		enabled: hasUserToken,
		staleTime: 5 * 60 * 1000,
	});

	const isSuperAdmin = !!data?.isSuperAdmin;
	const permissions = data?.permissions ?? [];

	const can = useCallback(
		(key: string) => isSuperAdmin || permissions.includes(key),
		[isSuperAdmin, permissions],
	);

	return {
		isSuperAdmin,
		permissions,
		can,
		canAdmin: isSuperAdmin,
		canPrice: isSuperAdmin || permissions.includes('produtos.price'),
		isLoading: hasUserToken && isLoading,
	};
}

export function usePermissionCatalog(enabled = true) {
	return useQuery({
		queryKey: ['permission-catalog'],
		queryFn: getPermissionCatalog,
		enabled,
		staleTime: 30 * 60 * 1000,
	});
}

export function useRoles(enabled = true) {
	const queryClient = useQueryClient();
	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ['roles'] });
		queryClient.invalidateQueries({ queryKey: ['me-permissions'] });
	};

	const { data: roles = [], isLoading } = useQuery({
		queryKey: ['roles'],
		queryFn: getRoles,
		enabled,
	});

	const createMutation = useMutation({
		mutationFn: (payload: RolePayload) => createRole(payload),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo criado!');
		},
		onError: () => toast.error('Erro ao criar cargo'),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: Partial<RolePayload>;
		}) => updateRole(id, payload),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar cargo'),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteRole(id),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo excluído!');
		},
		onError: (err: unknown) => {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? 'Erro ao excluir cargo';
			toast.error(msg);
		},
	});

	return {
		roles,
		isLoading,
		createRole: createMutation.mutateAsync,
		updateRole: updateMutation.mutateAsync,
		deleteRole: deleteMutation.mutateAsync,
		isMutating:
			createMutation.isPending ||
			updateMutation.isPending ||
			deleteMutation.isPending,
	};
}

/** Acesso atribuído (cargo + overrides) de um usuário, para o modal de edição. */
export function useUserAccess(userId: string | null) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ['user-access', userId],
		queryFn: () => getUserAccess(userId as string),
		enabled: !!userId,
	});

	const mutation = useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UserAccessPayload }) =>
			updateUserAccess(id, payload),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['user-access', id] });
			toast.success('Acesso atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar acesso'),
	});

	return {
		access: query.data ?? null,
		isLoading: query.isLoading,
		updateAccess: mutation.mutateAsync,
		isSaving: mutation.isPending,
	};
}
```

`src/modules/access/index.ts`:

```typescript
export {
	usePermissionCatalog,
	usePermissions,
	useRoles,
	useUserAccess,
} from './hooks/use-access';
export {
	createRole,
	deleteRole,
	getMyPermissions,
	getPermissionCatalog,
	getRoles,
	getUserAccess,
	updateRole,
	updateUserAccess,
} from './services/access.service';
export type {
	MyPermissions,
	PermissionModule,
	Role,
	RolePayload,
	UserAccess,
	UserAccessPayload,
	UserOverrides,
} from './types/access';
export {
	myPermissionsSchema,
	permissionModuleSchema,
	roleSchema,
	userAccessSchema,
} from './types/access';
```

- [ ] **Step 2: Confirmar a assinatura de `getToken`**

Run: `grep -n "export function getToken" src/lib/auth.ts`
Expected: `getToken` aceita um argumento de tipo (ex.: `getToken(kind: 'user' | 'customer')`). Se a assinatura for sem argumento, ajustar a chamada em `usePermissions` para `getToken()`.

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos referentes a estes arquivos.

---

### Task 4: Repointar consumidores de `usePermissions`

Troca puramente de import: `@/hooks/use-permissions` → `@/modules/access`. A assinatura é idêntica, então nada mais muda.

**Files (modificar a linha de import em cada um):**
- `src/components/biblioteca/biblioteca-vetores-view.tsx`
- `src/components/dashboard/month-summary.tsx`
- `src/components/dashboard/quick-access.tsx`
- `src/components/dashboard/recent-activity.tsx`
- `src/components/dashboard/sidebar.tsx`
- `src/components/dashboard/stats-overview.tsx`
- `src/components/products/addon-card.tsx`
- `src/components/products/product-card.tsx`
- `src/components/products/basic-info-section.tsx`
- `src/app/previas-admin/page.tsx`
- `src/app/vetorizacao-admin/page.tsx`
- `src/app/(admin)/sales/page.tsx`
- `src/app/(admin)/sales/voxes/page.tsx`
- `src/app/(admin)/sales/refunds/page.tsx`
- `src/app/(admin)/sales/recurring/page.tsx`
- `src/app/alunos/page.tsx`
- `src/app/alunos/[id]/page.tsx`
- `src/app/parametros/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/suporte/page.tsx`
- `src/app/acessos/page.tsx` (também migrado na Task 8)

- [ ] **Step 1: Repointar todos os imports**

Em cada arquivo acima, trocar:

```typescript
import { usePermissions } from '@/hooks/use-permissions';
```

por:

```typescript
import { usePermissions } from '@/modules/access';
```

- [ ] **Step 2: Confirmar que não sobrou nenhum import antigo**

Run: `grep -rn "@/hooks/use-permissions" src`
Expected: nenhum resultado.

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos (a assinatura do hook não mudou).

---

### Task 5: Migrar permission-matrix e role-form-modal

**Files:**
- Modify: `src/components/acessos/permission-matrix.tsx`
- Modify: `src/components/acessos/role-form-modal.tsx`

- [ ] **Step 1: permission-matrix — trocar o import de tipo**

Trocar:

```typescript
import type { PermissionModule } from '@/types/roles';
```

por:

```typescript
import type { PermissionModule } from '@/modules/access';
```

(O resto do componente é agnóstico ao id do cargo — não muda.)

- [ ] **Step 2: role-form-modal — tipos e `role.key`**

Trocar o import:

```typescript
import type { PermissionModule, Role, RolePayload } from '@/modules/access';
```

Trocar a inicialização do nome (era `role?.role`):

```typescript
		setName(role?.key ?? '');
```

Trocar a chamada de submit para usar `key` e o id string:

```typescript
		await onSubmit(
			{
				key: name.trim(),
				label: label.trim() || name.trim(),
				grants: isSuperAdmin ? [] : grants,
				isSuperAdmin,
			},
			role?.id,
		);
```

Atualizar a prop `onSubmit` na interface para id string:

```typescript
	onSubmit: (payload: RolePayload, id?: string) => Promise<void>;
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: erros restantes apenas em `roles-tab.tsx`/`edit-user-modal.tsx`/`acessos/page.tsx` (migrados nas próximas tasks).

---

### Task 6: Migrar roles-tab

**Files:**
- Modify: `src/components/acessos/roles-tab.tsx`

- [ ] **Step 1: Trocar imports**

```typescript
import { usePermissionCatalog, useRoles } from '@/modules/access';
import type { Role, RolePayload } from '@/modules/access';
```

- [ ] **Step 2: id string no submit, delete e render**

Trocar a assinatura/handler de submit:

```typescript
	const handleSubmit = async (payload: RolePayload, id?: string) => {
		if (id) await updateRole({ id, payload });
		else await createRole(payload);
		setShowForm(false);
		setEditingRole(null);
	};
```

`deleteRole(deleteTarget.id)` já funciona (id agora é string). No bloco de render do card, trocar a referência ao identificador do cargo de `role.role` para `role.key`:

```tsx
										<p className="font-semibold text-slate-900 dark:text-white truncate">
											{role.label || role.key}
										</p>
										<p className="text-xs text-slate-400 dark:text-gray-500">
											{role.key}
										</p>
```

(Remover o `ID {role.id} · ` — o uuid não é útil na UI.) No modal de exclusão, trocar `deleteTarget.role` por `deleteTarget.key`.

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: `roles-tab.tsx` sem erros.

---

### Task 7: Migrar edit-user-modal para access-only

O modal passa a operar sobre `AppUser` (id uuid), pré-preenche via `useUserAccess` e salva via `updateAccess` (`PATCH /v1/user/:id/access`). Nome/e-mail viram somente leitura.

**Files:**
- Modify: `src/components/acessos/edit-user-modal.tsx`

- [ ] **Step 1: Reescrever o componente**

```tsx
'use client';

import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePermissionCatalog, useRoles, useUserAccess } from '@/modules/access';
import type { AppUser } from '@/modules/users';
import { PermissionMatrix } from './permission-matrix';

interface EditUserModalProps {
	user: AppUser | null;
	isOpen: boolean;
	onClose: () => void;
}

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
	const { roles } = useRoles(isOpen);
	const { data: catalog = [] } = usePermissionCatalog(isOpen);
	const { access, isLoading, updateAccess, isSaving } = useUserAccess(
		isOpen ? (user?.id ?? null) : null,
	);

	const [roleId, setRoleId] = useState<string | null>(null);
	const [effective, setEffective] = useState<string[]>([]);

	const allKeys = useMemo(
		() => catalog.flatMap((m) => m.actions.map((a) => `${m.module}.${a}`)),
		[catalog],
	);

	const selectedRole = roles.find((r) => r.id === roleId) ?? null;

	// Inicializa a partir do acesso atual do usuário (cargo + overrides).
	useEffect(() => {
		if (!isOpen || !user || isLoading) return;
		const rid = access?.roleId ?? roles[0]?.id ?? null;
		setRoleId(rid);
		const role = roles.find((r) => r.id === rid) ?? null;
		if (role?.isSuperAdmin) {
			setEffective(allKeys);
		} else {
			const base = new Set(role?.grants ?? []);
			for (const k of access?.overrides.granted ?? []) base.add(k);
			for (const k of access?.overrides.revoked ?? []) base.delete(k);
			setEffective([...base]);
		}
	}, [isOpen, user, isLoading, access, roles, allKeys]);

	if (!isOpen || !user) return null;

	function handleRoleChange(id: string) {
		setRoleId(id);
		const role = roles.find((r) => r.id === id) ?? null;
		setEffective(role?.isSuperAdmin ? allKeys : (role?.grants ?? []));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user || roleId == null) return;

		const base = new Set(selectedRole?.grants ?? []);
		const effSet = new Set(effective);
		const overrides = selectedRole?.isSuperAdmin
			? { granted: [], revoked: [] }
			: {
					granted: effective.filter((k) => !base.has(k)),
					revoked: [...base].filter((k) => !effSet.has(k)),
				};

		await updateAccess({ id: user.id, payload: { roleId, overrides } });
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') onClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Acesso do utilizador
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="mb-4 text-sm text-slate-600 dark:text-gray-400">
					<p className="font-medium text-slate-900 dark:text-white">
						{user.name ?? '—'}
					</p>
					<p>{user.email}</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="edit-role"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Cargo
						</label>
						<select
							id="edit-role"
							value={roleId ?? ''}
							onChange={(e) => handleRoleChange(e.target.value)}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 appearance-none"
						>
							{roles.map((r) => (
								<option key={r.id} value={r.id}>
									{r.label || r.key}
								</option>
							))}
						</select>
					</div>

					<div>
						<div className="flex items-center justify-between mb-2">
							<p className="text-sm font-medium text-slate-600 dark:text-gray-400">
								Permissões deste usuário
							</p>
							{!selectedRole?.isSuperAdmin && (
								<span className="text-xs text-slate-400 dark:text-gray-500">
									Começa do cargo; ajuste para criar exceções
								</span>
							)}
						</div>
						{selectedRole?.isSuperAdmin ? (
							<p className="text-sm text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 rounded-xl px-4 py-3">
								Cargo super admin: acesso total a tudo.
							</p>
						) : (
							<PermissionMatrix
								catalog={catalog}
								value={effective}
								onChange={setEffective}
							/>
						)}
					</div>

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-slate-100 dark:bg-[#252528] text-slate-700 dark:text-gray-300"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving || isLoading}
							className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
						>
							{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
							Guardar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: `edit-user-modal.tsx` sem erros (resta `acessos/page.tsx` e os modais create/delete).

---

### Task 8: Migrar a página de Acessos

**Files:**
- Modify: `src/app/acessos/page.tsx`

- [ ] **Step 1: Trocar imports e fontes de dados**

Trocar os imports do topo:

```typescript
import { usePermissions, useRoles } from '@/modules/access';
import { useUsers } from '@/modules/users';
import type { AppUser } from '@/modules/users';
```

(Remover `import { useUsers } from '@/hooks/use-users'`, `import type { User } from '@/types/users'` e o `useRoles` antigo.)

- [ ] **Step 2: Ajustar o consumo dos hooks**

`modules/users` `useUsers` retorna um objeto de query (`{ data, isLoading, error }`), não o shape antigo. Ajustar:

```typescript
	const {
		data: users = [],
		isLoading: usersLoading,
		error,
	} = useUsers({});
	const { roles } = useRoles(allowed);
```

Filtrar para não-`customer` (usuários do painel) na renderização:

```typescript
	const panelUsers = users.filter((u) => u.role !== 'customer');
```

Trocar o tipo dos estados de modal de `User` para `AppUser`:

```typescript
	const [editUser, setEditUser] = useState<AppUser | null>(null);
	const [deleteUserTarget, setDeleteUserTarget] = useState<AppUser | null>(null);
```

- [ ] **Step 3: Remover o fluxo `handleSave`/`updateUser` antigo**

O salvamento de acesso agora vive dentro do `EditUserModal` (Task 7). Remover a função `handleSave` e a desestruturação de `updateUser`/`deleteUser`/`isDeleting` que vinha do hook antigo. Para exclusão, usar o hook legado diretamente (criar/excluir permanecem legados):

```typescript
import { deleteColaborador } from '@/services/colaboradores';
import { useQueryClient } from '@tanstack/react-query';
```

```typescript
	const queryClient = useQueryClient();
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleDelete(id: string) {
		setIsDeleting(true);
		try {
			await deleteColaborador(id);
			queryClient.invalidateQueries({ queryKey: ['users'] });
			setDeleteUserTarget(null);
		} finally {
			setIsDeleting(false);
		}
	}
```

- [ ] **Step 4: Ajustar a tabela**

Trocar `users?.map` por `panelUsers.map`, e a coluna "Cargo" para mostrar "—" (o cargo granular é carregado no modal). Remover o helper `roleLabel`. Exemplo da célula:

```tsx
												<td className="px-4 py-3 text-slate-500 dark:text-gray-500">
													—
												</td>
```

Atualizar os `<EditUserModal />` e `<DeleteUserModal />` para as novas props:

```tsx
			<EditUserModal
				user={editUser}
				isOpen={!!editUser}
				onClose={() => setEditUser(null)}
			/>
			<DeleteUserModal
				user={deleteUserTarget}
				isOpen={!!deleteUserTarget}
				onClose={() => setDeleteUserTarget(null)}
				onDelete={handleDelete}
				isDeleting={isDeleting}
			/>
```

- [ ] **Step 5: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: `acessos/page.tsx` sem erros (restam os modais create/delete).

---

### Task 9: Migrar create-user-modal e delete-user-modal

**Files:**
- Modify: `src/components/acessos/create-user-modal.tsx`
- Modify: `src/components/acessos/delete-user-modal.tsx`

- [ ] **Step 1: create-user-modal — remover seleção numérica de Permissions**

A criação permanece no endpoint legado (`registerUser`), mas sem o `<select>` de `Permissions` numérico (a constante `ROLES` será removida na Task 10). O cargo é atribuído depois, pelo modal de edição. Trocar:

Remover `import { ROLES } from '@/utils/constants/roles';`.

Trocar o state inicial de role/permissions por um seletor coarse (staff/admin):

```typescript
	const [role, setRole] = useState<'staff' | 'admin'>('staff');
```

Remover `permissions`/`setPermissions`, `handleRoleChange`, `handlePermissionsChange`. No `handleClose`, remover os resets de permissions. No `mutation`/`handleSubmit`, enviar `Permissions: null`:

```typescript
		mutation.mutate({
			name: name.trim(),
			email: email.trim(),
			password,
			role,
			Permissions: null,
		});
```

Substituir os dois `<select>` (Cargo + Permissões) por um único `<select>` de função coarse:

```tsx
					<div>
						<label
							htmlFor="create-role"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Função
						</label>
						<select
							id="create-role"
							value={role}
							onChange={(e) => setRole(e.target.value as 'staff' | 'admin')}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
						>
							<option value="staff">Staff</option>
							<option value="admin">Admin</option>
						</select>
						<p className="mt-1.5 text-xs text-slate-400 dark:text-gray-500">
							O cargo de permissões é atribuído depois, em "Editar".
						</p>
					</div>
```

(Manter a invalidação `queryKey: ['users']` no `onSuccess` — o `useUsers` de `modules/users` usa a key `['users']`.)

- [ ] **Step 2: delete-user-modal — tipar por AppUser**

Trocar:

```typescript
import type { AppUser } from '@/modules/users';
```

e a prop:

```typescript
	user: AppUser | null;
```

`AppUser.name` é `string | null`; ajustar a exibição:

```tsx
				<p className="text-slate-900 dark:text-white font-semibold mb-1">
					{user.name ?? '—'}
				</p>
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

---

### Task 10: Aposentar a camada antiga de cargos e verificação final

**Files:**
- Modify: `src/utils/constants/permissions.ts`
- Delete: `src/hooks/use-permissions.ts`, `src/hooks/use-roles.ts`, `src/services/roles.ts`, `src/types/roles.ts`, `src/utils/constants/roles.ts`

- [ ] **Step 1: Repointar `utils/constants/permissions.ts`**

Trocar:

```typescript
import type { PermissionModule } from '@/modules/access';
```

- [ ] **Step 2: Confirmar que os arquivos a remover não têm mais consumidores**

Run: `grep -rn "@/hooks/use-permissions\|@/hooks/use-roles\|@/services/roles\|@/types/roles\|@/utils/constants/roles" src`
Expected: nenhum resultado. Se aparecer algum, repointar antes de deletar.

- [ ] **Step 3: Remover os arquivos antigos**

```bash
git rm src/hooks/use-permissions.ts src/hooks/use-roles.ts \
       src/services/roles.ts src/types/roles.ts src/utils/constants/roles.ts
```

- [ ] **Step 4: Typecheck + lint + build**

Run: `npx tsc --noEmit`
Expected: PASS sem erros.

Run: `npx @biomejs/biome check src`
Expected: sem erros (rodar `npx @biomejs/biome check --write src` para auto-fix de formatação se necessário).

Run: `npm run build`
Expected: build conclui sem erros de tipo.

- [ ] **Step 5: QA manual** (sem framework de testes)

1. Login como usuário super admin → confirmar que o painel inteiro aparece e `GET /v1/me/permissions` retorna `isSuperAdmin: true`.
2. Login como staff com cargo restrito → confirmar que a navbar oculta seções sem `*.view` (via `canSeeNavItem`) e que páginas redirecionam quando sem permissão.
3. Aba Acessos → Cargos: criar, editar e excluir um cargo → confirmar chamadas `POST/PATCH/DELETE /v1/roles|role/:id` e payload `{ key, label, grants, is_super_admin }`.
4. Aba Acessos → Utilizadores: abrir "Editar" de um usuário → confirmar `GET /v1/user/:id/access` pré-preenchendo cargo+matriz; salvar → confirmar `PATCH /v1/user/:id/access` com `{ role_id, overrides }`.
5. Criar usuário (staff) e excluir usuário → confirmar que continuam funcionando (caminho legado) e que a lista (`/v1/users`) reflete a mudança após invalidação.

---

## Self-review (cobertura do spec)

- `GET /v1/me/permissions` → Task 2/3 (`getMyPermissions`, `usePermissions`). ✅
- `GET /v1/permissions/catalog` → Task 2/3. ✅
- Roles CRUD (`/v1/roles`, `/v1/role/:id`, body `key/is_super_admin`) → Task 2/3/5/6. ✅
- `GET/PATCH /v1/user/:id/access` → Task 2/3/7. ✅
- Un-stub do gating + back-compat `canPrice`/`canAdmin` → Task 3. ✅
- Lista via `modules/users`, coluna cargo no modal, criar/excluir legados → Task 8/9. ✅
- Aposentadoria da camada antiga de cargos (sem tocar no diretório de usuários compartilhado) → Task 10. ✅

## Pontos a confirmar com o backend durante a execução

- Shape exato do **GET de cargo** (assumido `{ id, key, label, grants, is_super_admin }`). Se divergir, ajustar `roleWireSchema`.
- Casing do `/v1/me/permissions` (assumido camelCase `isSuperAdmin`/`permissions` conforme spec).
- Se um usuário criado via `/register/user` (legado) aparece em `GET /v1/users`.
