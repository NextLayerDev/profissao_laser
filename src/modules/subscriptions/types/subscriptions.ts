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

/** Assinatura como vem do read `/v1/me/subscriptions`. */
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

// ── Write path (backend real: POST /subscription, /subscription/upgrade|downgrade) ──

/** Cria a assinatura Stripe (admin/checkout). Rota `POST /subscription`. */
export const createSubscriptionPayloadSchema = z.object({
	email: z.string().email(),
	stripeProductId: z.string().min(1),
	amount: z.number().min(0),
	interval: z.enum(['day', 'week', 'month', 'year']),
	intervalCount: z.number().int().min(1),
	endsAt: z.string(),
});
export type CreateSubscriptionPayload = z.infer<
	typeof createSubscriptionPayloadSchema
>;

/** Troca de plano (upgrade/downgrade). Rotas `POST /subscription/{upgrade,downgrade}`. */
export const subscriptionChangePayloadSchema = z.object({
	productId: z.uuid(),
});
export type SubscriptionChangePayload = z.infer<
	typeof subscriptionChangePayloadSchema
>;

export const subscriptionChangeResponseSchema = z.object({
	subscriptionId: z.string(),
	status: z.string(),
	previousPlan: z.string(),
	newPlan: z.string(),
});
export type SubscriptionChangeResponse = z.infer<
	typeof subscriptionChangeResponseSchema
>;
