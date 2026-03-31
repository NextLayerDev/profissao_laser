import { z } from 'zod';

export const mySubscriptionSchema = z.object({
	id: z.string(),
	status: z.string(),
	product_name: z.string(),
	amount: z.number(),
	currency: z.string(),
	interval: z.enum(['month', 'year']),
	currentPeriodEnd: z.string().nullable(),
	cancelAtPeriodEnd: z.boolean(),
});

export type MySubscription = z.infer<typeof mySubscriptionSchema>;
