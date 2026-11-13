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
	// 'lifetime' = pacote de pagamento único (vem na mesma lista do upvox).
	interval: z.enum(['monthly', 'yearly', 'lifetime']),
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

export const billingPortalResponseSchema = z.object({
	portal_url: z.string(),
});
export type BillingPortalResponse = z.infer<typeof billingPortalResponseSchema>;

export const subscriptionRefundResultSchema = z.object({
	stripe_refund_id: z.string(),
	amount_cents: z.number().int(),
	status: z.string(),
	subscription_canceled: z.boolean(),
});
export type SubscriptionRefundResult = z.infer<
	typeof subscriptionRefundResultSchema
>;

export interface CreateSubscriptionPayload {
	plan_key: string;
	interval: SubscriptionInterval;
}

/** Troca de plano pelo aluno (prévia e confirmação usam o mesmo corpo). */
export interface PlanChangePayload {
	plan_key: string;
	interval: SubscriptionInterval;
	/** Instante da prévia: a cobrança bate com o valor mostrado. */
	proration_date?: number;
}

export const planChangePreviewSchema = z.object({
	/** `now` = paga a diferença e troca já; `period_end` = troca na renovação. */
	timing: z.enum(['now', 'period_end']),
	plan_key: z.string(),
	plan_name: z.string(),
	interval: subscriptionIntervalSchema,
	charge_cents: z.number().int(),
	credit_cents: z.number().int(),
	amount_due_cents: z.number().int(),
	balance_credit_cents: z.number().int(),
	effective_at: z.string(),
	next_renewal_at: z.string(),
	renewal_price_cents: z.number().int(),
	proration_date: z.number().int().nullable(),
	/** Assinatura no boleto: a troca paga exige cadastrar um cartão antes. */
	requires_card: z.boolean().default(false),
});
export type PlanChangePreview = z.infer<typeof planChangePreviewSchema>;

export const planChangeResultSchema = z.object({
	status: z.enum(['applied', 'scheduled', 'requires_payment']),
	effective_at: z.string(),
	amount_paid_cents: z.number().int(),
	invoice_url: z.string().nullable(),
	expires_at: z.string().nullable(),
});
export type PlanChangeResult = z.infer<typeof planChangeResultSchema>;

export interface ChangeSubscriptionPayload {
	plan_key: string;
	interval?: SubscriptionInterval;
}
