import { z } from 'zod';

export const userRoleSchema = z.enum(['customer', 'staff', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const appUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	phone: z.string().nullable().optional(),
	name: z.string().nullable().optional(),
	role: userRoleSchema,
	access_role_id: z.string().uuid().nullable().optional(),
	access_role: z
		.object({
			key: z.string(),
			label: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	blocked: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type AppUser = z.infer<typeof appUserSchema>;

export interface ListUsersParams {
	role?: UserRole;
	limit?: number;
	offset?: number;
}
