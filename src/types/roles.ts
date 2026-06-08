import { z } from 'zod';

export const permissionModuleSchema = z.object({
	module: z.string(),
	label: z.string(),
	actions: z.array(z.string()),
});
export type PermissionModule = z.infer<typeof permissionModuleSchema>;

export const roleSchema = z.object({
	id: z.number(),
	role: z.string(),
	label: z.string().nullable().optional(),
	grants: z.array(z.string()).default([]),
	isSuperAdmin: z.boolean().default(false),
});
export type Role = z.infer<typeof roleSchema>;

export const effectivePermissionsSchema = z.object({
	isSuperAdmin: z.boolean(),
	permissions: z.array(z.string()),
});
export type EffectivePermissions = z.infer<typeof effectivePermissionsSchema>;

export interface RolePayload {
	role: string;
	label?: string;
	grants: string[];
	isSuperAdmin: boolean;
}

export interface UserOverrides {
	granted: string[];
	revoked: string[];
}
