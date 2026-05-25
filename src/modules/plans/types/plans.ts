import { z } from 'zod';

export const planSchema = z.object({
	id: z.string(),
	key: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	published: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Plan = z.infer<typeof planSchema>;

export const createPlanSchema = z.object({
	key: z
		.string()
		.min(1)
		.max(40)
		.regex(/^[a-z0-9_]+$/, 'snake_case (a-z, 0-9, _)'),
	name: z.string().min(1).max(120),
	description: z.string().max(1000).optional(),
	published: z.boolean().optional(),
});
export type CreatePlanPayload = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial();
export type UpdatePlanPayload = z.infer<typeof updatePlanSchema>;
