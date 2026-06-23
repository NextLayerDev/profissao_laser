import { z } from 'zod';

export const userOverridesSchema = z.object({
	granted: z.array(z.string()).default([]),
	revoked: z.array(z.string()).default([]),
});
export type UserOverrides = z.infer<typeof userOverridesSchema>;

export const userSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	role: z.string(),
	Permissions: z.number().nullable(),
	overrides: userOverridesSchema.nullable().optional(),
	created_at: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const updateUserPayloadSchema = z.object({
	name: z.string().min(2).optional(),
	email: z.string().email().optional(),
	role: z.string().optional(),
	Permissions: z.number().nullable().optional(),
	overrides: userOverridesSchema.optional(),
	password: z.string().min(6).optional(),
});

export type UpdateUserPayload = z.infer<typeof updateUserPayloadSchema>;

export const createStaffPayloadSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	role: z.enum(['staff', 'admin']),
	name: z.string().min(1).optional(),
	phone: z.string().optional(),
});

export type CreateStaffPayload = z.infer<typeof createStaffPayloadSchema>;
