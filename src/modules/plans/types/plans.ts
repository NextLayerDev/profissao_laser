import { z } from 'zod';

/**
 * Um item da lista de "features da landing" de um plano. O admin monta essa lista
 * no modal de Editar plano; a landing renderiza `label` na ordem. `type` diz a
 * origem (tool real / área do app / texto livre) e `ref` guarda o alvo
 * (tool.key ou href da área) — hoje usado só como metadado (a landing exibe label).
 */
export const planFeatureItemSchema = z.object({
	id: z.string(),
	type: z.enum(['tool', 'area', 'text']),
	ref: z.string().nullable().optional(),
	label: z.string(),
});
export type PlanFeatureItem = z.infer<typeof planFeatureItemSchema>;

export const planSchema = z.object({
	id: z.string(),
	key: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	published: z.boolean(),
	price_monthly_cents: z.number().int().nullable().optional(),
	price_yearly_cents: z.number().int().nullable().optional(),
	/** Voxxys grátis por período (compra + renovações) — cobrados da empresa a R$1,20/voxxy na fatura aberta. */
	vox_monthly_grant: z.number().int().optional().default(0),
	/** Itens exibidos nos cards da landing (tools/áreas/texto), definidos pelo admin. */
	features: z.array(planFeatureItemSchema).optional().default([]),
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
	vox_monthly_grant: z.number().int().min(0).optional(),
	/** Itens da landing (tools/áreas/texto) definidos pelo admin. */
	features: z.array(planFeatureItemSchema).optional(),
});
export type CreatePlanPayload = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial();
export type UpdatePlanPayload = z.infer<typeof updatePlanSchema>;
