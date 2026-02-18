import { z } from 'zod';

export const customerPlanSchema = z.object({
	id: z.string(),
	status: z.string(),
	product_name: z.string(),
	slug: z.string(),
});

export type CustomerPlan = z.infer<typeof customerPlanSchema>;

export const customerPlansResponseSchema = z.array(customerPlanSchema);
export type CustomerPlansResponse = z.infer<typeof customerPlansResponseSchema>;
