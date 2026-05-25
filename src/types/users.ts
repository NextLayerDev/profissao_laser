import { z } from 'zod';

export const userSchema = z.object({
	id: z.string().uuid(),
	name: z.string().nullable().optional(),
	email: z.string().email(),
	role: z.string(),
	Permissions: z.number().nullable().optional(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
	phone: z.string().nullable().optional(),
	blocked: z.boolean().optional(),
});

export type User = z.infer<typeof userSchema>;

export const updateUserPayloadSchema = z.object({
	name: z.string().min(2).optional(),
	email: z.string().email().optional(),
	role: z.string().optional(),
	Permissions: z.number().nullable().optional(),
	password: z.string().min(6).optional(),
});

export type UpdateUserPayload = z.infer<typeof updateUserPayloadSchema>;
