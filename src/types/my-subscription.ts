import { z } from 'zod';

export const mySubscriptionSchema = z.object({
	id: z.string(),
	status: z.string(),
	product_name: z.string(),
	/** Chave do plano no upvox (para a troca de plano). */
	planKey: z.string().nullable(),
	amount: z.number(),
	currency: z.string(),
	interval: z.enum(['month', 'year']),
	currentPeriodStart: z.string().nullable(),
	currentPeriodEnd: z.string().nullable(),
	cancelAtPeriodEnd: z.boolean(),
});

export type MySubscription = z.infer<typeof mySubscriptionSchema>;
