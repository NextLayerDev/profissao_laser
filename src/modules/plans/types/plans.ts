import { z } from 'zod';

export const planSchema = z.object({
	id: z.string(),
	key: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	published: z.boolean(),
	/** Preço mensal em centavos — provisionado no Stripe na criação do plano. */
	price_monthly_cents: z.number().int().nullable().optional(),
	/** Preço anual em centavos — provisionado no Stripe na criação do plano. */
	price_yearly_cents: z.number().int().nullable().optional(),
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
	/** Obrigatórios na criação — o Stripe é provisionado automaticamente. */
	price_monthly_cents: z.number().int().min(0),
	price_yearly_cents: z.number().int().min(0),
});
export type CreatePlanPayload = z.infer<typeof createPlanSchema>;

// key não é editável depois da criação; preços são opcionais na edição
export const updatePlanSchema = createPlanSchema
	.omit({ key: true })
	.extend({
		price_monthly_cents: z.number().int().min(0).optional(),
		price_yearly_cents: z.number().int().min(0).optional(),
	})
	.partial();
export type UpdatePlanPayload = z.infer<typeof updatePlanSchema>;
