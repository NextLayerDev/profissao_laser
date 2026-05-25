import { z } from 'zod';

export const meSchema = z
	.object({
		id: z.string(),
		email: z.string().email(),
		phone: z.string().nullable().optional(),
		name: z.string().nullable().optional(),
		role: z.string(),
		blocked: z.boolean().optional(),
		created_at: z.string().optional(),
		updated_at: z.string().optional(),
	})
	.passthrough();
export type Me = z.infer<typeof meSchema>;

export const updateMeSchema = z.object({
	name: z.string().min(1),
});
export type UpdateMePayload = z.infer<typeof updateMeSchema>;
