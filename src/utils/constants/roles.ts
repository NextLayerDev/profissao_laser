export interface RoleConfig {
	id: number;
	role: string;
	canPrice: boolean;
	canAdmin: boolean;
}

export const ROLES: RoleConfig[] = [
	{ id: 1, role: 'Super Admin', canPrice: true, canAdmin: true },
	{ id: 2, role: 'Financial', canPrice: true, canAdmin: false },
	{ id: 3, role: 'colaborador', canPrice: false, canAdmin: false },
	{ id: 4, role: 'admin', canPrice: false, canAdmin: true },
];

export function getRoleByPermissionId(
	permissionId: number | null,
): RoleConfig | null {
	if (permissionId == null) return null;
	return ROLES.find((r) => r.id === permissionId) ?? null;
}

export function getRoleByRoleName(roleName: string): RoleConfig | null {
	return ROLES.find((r) => r.role === roleName) ?? null;
}
