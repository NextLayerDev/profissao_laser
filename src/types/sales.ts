import { z } from 'zod';

export const salesSchema = z.object({
	id: z.string(),
	date: z.string(),
	amount: z.number(),
	currency: z.string().nullable(),
	status: z.string(),
	product: z.string(),
	customer: z.object({
		name: z.string(),
		email: z.string(),
		phone: z.string().optional().nullable(),
	}),
	receipt_url: z.string().nullable(),
	subscriptionMonth: z.number().int().positive(),
});

export type Sales = z.infer<typeof salesSchema>;

export const recurringSubscriptionSchema = z.object({
	id: z.string(),
	status: z.string(),
	customer: z.object({
		name: z.string(),
		email: z.string(),
		phone: z.string().optional().nullable(),
	}),
	product: z.string(),
	amount: z.number(),
	currency: z.string(),
	interval: z.string(),
	intervalCount: z.number(),
	nextChargeAt: z.string(),
	cancelAtPeriodEnd: z.boolean(),
});

export type RecurringSubscription = z.infer<typeof recurringSubscriptionSchema>;

export const refundSchema = z.object({
	id: z.string(),
	date: z.string(),
	amount: z.number(),
	currency: z.string(),
	status: z.enum(['succeeded', 'pending', 'failed']),
	reason: z
		.enum(['duplicate', 'fraudulent', 'requested_by_customer'])
		.nullable(),
	charge_id: z.string(),
	customer: z.object({
		name: z.string(),
		email: z.string(),
		phone: z.string().optional().nullable(),
	}),
});

export type Refund = z.infer<typeof refundSchema>;
