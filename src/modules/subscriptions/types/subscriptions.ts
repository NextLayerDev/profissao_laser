import { z } from 'zod';

export const subscriptionIntervalSchema = z.enum(['monthly', 'yearly']);
export type SubscriptionInterval = z.infer<typeof subscriptionIntervalSchema>;

export const subscriptionStatusSchema = z.enum([
	'trialing',
	'active',
	'past_due',
	'canceled',
	'paused',
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionSchema = z.object({
	id: z.string(),
	customer_id: z.string(),
	plan_id: z.string(),
	interval: subscriptionIntervalSchema,
	stripe_subscription_id: z.string(),
	stripe_customer_id: z.string(),
	status: subscriptionStatusSchema,
	current_period_start: z.string(),
	current_period_end: z.string(),
	cancel_at_period_end: z.boolean(),
	price_cents: z.number().int(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const checkoutResponseSchema = z.object({
	checkout_url: z.string(),
});
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

export interface CreateSubscriptionPayload {
	plan_key: string;
	interval: SubscriptionInterval;
}

export interface ChangeSubscriptionPayload {
	plan_key: string;
	interval?: SubscriptionInterval;
}
