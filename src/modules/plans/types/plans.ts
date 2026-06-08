import { z } from 'zod';

export const planSchema = z.object({
	id: z.string(),
	key: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	published: z.boolean(),
	price_monthly_cents: z.number().int().nullable().optional(),
	price_yearly_cents: z.number().int().nullable().optional(),
	stripe_product_id: z.string().nullable().optional(),
	stripe_price_monthly_id: z.string().nullable().optional(),
	stripe_price_yearly_id: z.string().nullable().optional(),
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
	price_monthly_cents: z.number().int().min(0).nullable().optional(),
	price_yearly_cents: z.number().int().min(0).nullable().optional(),
});
export type CreatePlanPayload = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial();
export type UpdatePlanPayload = z.infer<typeof updatePlanSchema>;
