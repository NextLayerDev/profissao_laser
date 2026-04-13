import { z } from 'zod';

const subscriptionSchema = z.object({
	status: z.string(),
	currentPeriodEnd: z.string().nullable(),
	cancelAtPeriodEnd: z.boolean(),
});

export const customerSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	phone: z.string().nullable().optional(),
	banned: z.boolean().default(false),
	subscription: subscriptionSchema.nullable().optional(),
});

export type Customer = z.infer<typeof customerSchema>;
export type CustomerSubscription = z.infer<typeof subscriptionSchema>;
