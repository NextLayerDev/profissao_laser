import { z } from 'zod';

export const customerPlanTierSchema = z
	.enum(['prata', 'ouro', 'platina'])
	.optional();

export const customerPlanSchema = z.object({
	id: z.string(),
	status: z.string(),
	product_name: z.string(),
	slug: z.string().nullable(),
	/** Classe do plano (prata, ouro, platina). Usado para priorizar o de classe mais alta na listagem. */
	tier: customerPlanTierSchema,
});

export type CustomerPlan = z.infer<typeof customerPlanSchema>;

export const customerPlansResponseSchema = z.array(customerPlanSchema);
export type CustomerPlansResponse = z.infer<typeof customerPlansResponseSchema>;
