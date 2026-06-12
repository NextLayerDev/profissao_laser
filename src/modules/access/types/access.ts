import { z } from 'zod';

// ── Catálogo de módulos × ações ───────────────────────────────
// `id` vem do catálogo (PermissionModuleRow) e é necessário para editar/excluir
// um módulo; a matriz de permissões só usa module/label/actions e o ignora.
export const permissionModuleSchema = z.object({
	id: z.string().optional(),
	module: z.string(),
	label: z.string(),
	actions: z.array(z.string()),
});
export type PermissionModule = z.infer<typeof permissionModuleSchema>;

export interface PermissionModulePayload {
	module: string;
	label: string;
	actions: string[];
}

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
const myPermissionsWireSchema = z.object({
	isSuperAdmin: z.boolean().optional(),
	is_super_admin: z.boolean().optional(),
	permissions: z.array(z.string()).default([]),
});
export const myPermissionsSchema = myPermissionsWireSchema.transform((p) => ({
	isSuperAdmin: !!(p.isSuperAdmin || p.is_super_admin),
	permissions: p.permissions,
}));
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
