import { z } from 'zod';

/**
 * Resposta de GET /v1/course/:slug/plans
 *
 * Cada item representa um plano disponível para o curso.
 * Os preços agora estão dentro de `plan`, não no nível raiz da entrada.
 */
export const catalogPlanItemSchema = z.object({
	course_id: z.string(),
	plan_id: z.string(),
	published: z.boolean(),
	plan: z.object({
		id: z.string(),
		key: z.string(),
		name: z.string(),
		description: z.string().nullable().optional(),
		/** Preço mensal em centavos. */
		price_monthly_cents: z.number().int().nullable().optional(),
		/** Preço anual em centavos. */
		price_yearly_cents: z.number().int().nullable().optional(),
	}),
});

export type CatalogPlanItem = z.infer<typeof catalogPlanItemSchema>;

export const catalogPlansResponseSchema = z.array(catalogPlanItemSchema);
export type CatalogPlansResponse = z.infer<typeof catalogPlansResponseSchema>;
