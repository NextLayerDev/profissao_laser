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

export const updateCustomerSchema = z.object({
	name: z.string().min(2).optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
});
export type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;
