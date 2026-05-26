import { api } from '@/lib/fetch';
import {
	type EffectivePermissions,
	effectivePermissionsSchema,
	type PermissionModule,
	permissionModuleSchema,
	type Role,
	type RolePayload,
	roleSchema,
} from '@/types/roles';

/** Permissões efetivas do staff logado (base do gating). */
export async function getMyPermissions(): Promise<EffectivePermissions> {
	const { data } = await api.get('/me/permissions');
	return effectivePermissionsSchema.parse(data);
}

/** Catálogo de módulos×ações (para a matriz de configuração). */
export async function getPermissionCatalog(): Promise<PermissionModule[]> {
	const { data } = await api.get('/permissions/catalog');
	return permissionModuleSchema.array().parse(data);
}

export async function getRoles(): Promise<Role[]> {
	const { data } = await api.get('/roles');
	return roleSchema.array().parse(data);
}

export async function createRole(payload: RolePayload): Promise<Role> {
	const { data } = await api.post('/roles', payload);
	return roleSchema.parse(data);
}

export async function updateRole(
	id: number,
	payload: Partial<RolePayload>,
): Promise<Role> {
	const { data } = await api.patch(`/role/${id}`, payload);
	return roleSchema.parse(data);
}

export async function deleteRole(id: number): Promise<void> {
	await api.delete(`/role/${id}`);
}
