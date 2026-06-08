import { z } from 'zod';

// ─── Assinaturas ────────────────────────────────────────

export const subscriptionItemSchema = z.object({
	subscription_id: z.string(),
	status: z.string(),
	interval: z.enum(['month', 'year']),
	cancel_at_period_end: z.boolean(),
	created_at: z.string(),
	current_period_start: z.string(),
	current_period_end: z.string(),
	customer: z.object({
		id: z.string(),
		email: z.string(),
		name: z.string(),
		phone: z.string().nullable(),
	}),
	plan: z.object({
		id: z.string(),
		key: z.string(),
		name: z.string(),
	}),
	price_cents: z.number().int(),
	mrr_cents: z.number().int(),
});
export type SubscriptionItem = z.infer<typeof subscriptionItemSchema>;

export const salesPaginatedResponseSchema = z.object({
	data: z.array(subscriptionItemSchema),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type SalesPaginatedResponse = z.infer<
	typeof salesPaginatedResponseSchema
>;

export const salesSummarySchema = z.object({
	totals_by_status: z.object({
		active: z.number().int(),
		trialing: z.number().int(),
		past_due: z.number().int(),
		canceled: z.number().int(),
		paused: z.number().int(),
	}),
	new_sales: z.number().int(),
	mrr_cents: z.number().int(),
	estimated_revenue_cents: z.number().int(),
	predicted_churn: z.object({
		count: z.number().int(),
		mrr_at_risk_cents: z.number().int(),
	}),
});
export type SalesSummary = z.infer<typeof salesSummarySchema>;

// ─── Voxxys ─────────────────────────────────────────────

export const voxAnalyticsItemSchema = z.object({
	ledger_id: z.string(),
	created_at: z.string(),
	vox_amount: z.number().int(),
	price_cents: z.number().int(),
	stripe_session_id: z.string().nullable(),
	customer: z.object({
		id: z.string(),
		email: z.string(),
		name: z.string(),
		phone: z.string().nullable(),
	}),
	vox_package: z
		.object({
			id: z.string(),
			name: z.string(),
			vox_amount: z.number().int(),
			price_cents: z.number().int(),
		})
		.nullable(),
});
export type VoxAnalyticsItem = z.infer<typeof voxAnalyticsItemSchema>;

export const voxesPaginatedResponseSchema = z.object({
	data: z.array(voxAnalyticsItemSchema),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type VoxesPaginatedResponse = z.infer<
	typeof voxesPaginatedResponseSchema
>;

export const voxesSummarySchema = z.object({
	sales_count: z.number().int(),
	voxes_sold: z.number().int(),
	revenue_cents: z.number().int(),
	by_package: z.array(
		z.object({
			vox_package_id: z.string().nullable(),
			package_name: z.string().nullable(),
			sales_count: z.number().int(),
			voxes_sold: z.number().int(),
			revenue_cents: z.number().int(),
		}),
	),
});
export type VoxesSummary = z.infer<typeof voxesSummarySchema>;

// ─── Query params ────────────────────────────────────────

export type SubscriptionStatus =
	| 'active'
	| 'trialing'
	| 'past_due'
	| 'canceled'
	| 'paused';

export interface SalesQueryParams {
	from?: string;
	to?: string;
	date_field?: 'created_at' | 'current_period_end';
	status?: SubscriptionStatus | SubscriptionStatus[];
	cancel_at_period_end?: boolean;
	plan_id?: string;
	interval?: 'month' | 'year';
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
}

export interface VoxesQueryParams {
	from?: string;
	to?: string;
	vox_package_id?: string;
	customer_id?: string;
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
}
