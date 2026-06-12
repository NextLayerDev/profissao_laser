import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type MyPermissions,
	myPermissionsSchema,
	type PermissionModule,
	type PermissionModulePayload,
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

export async function createPermissionModule(
	payload: PermissionModulePayload,
): Promise<PermissionModule> {
	const { data } = await api.post('/v1/permission-modules', payload);
	return permissionModuleSchema.parse(data);
}

export async function updatePermissionModule(
	id: string,
	payload: Partial<PermissionModulePayload>,
): Promise<PermissionModule> {
	const { data } = await api.patch(`/v1/permission-module/${id}`, payload);
	return permissionModuleSchema.parse(data);
}

export async function deletePermissionModule(id: string): Promise<void> {
	await api.delete(`/v1/permission-module/${id}`);
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
		...(p.isSuperAdmin !== undefined ? { is_super_admin: p.isSuperAdmin } : {}),
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
