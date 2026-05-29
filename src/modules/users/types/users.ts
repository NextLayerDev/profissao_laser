import { z } from 'zod';

export const userRoleSchema = z.enum(['customer', 'staff', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const appUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	phone: z.string().nullable().optional(),
	name: z.string().nullable().optional(),
	role: userRoleSchema,
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
