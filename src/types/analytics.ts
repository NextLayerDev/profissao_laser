import { z } from 'zod';

// ─── Query params ──────────────────────────────────────────────────────────

export const analyticsSalesSort = z.enum([
	'created_at:asc',
	'created_at:desc',
	'current_period_end:asc',
	'current_period_end:desc',
	'price_cents:asc',
	'price_cents:desc',
]);
export type AnalyticsSalesSort = z.infer<typeof analyticsSalesSort>;

export const analyticsSalesStatus = z.enum([
	'active',
	'trialing',
	'past_due',
	'canceled',
	'paused',
]);
export type AnalyticsSalesStatus = z.infer<typeof analyticsSalesStatus>;

export interface AnalyticsSalesParams {
	page?: number;
	per_page?: number;
	sort?: AnalyticsSalesSort;
	from?: string;
	to?: string;
	date_field?: 'created_at' | 'current_period_end';
	status?: AnalyticsSalesStatus | AnalyticsSalesStatus[];
	cancel_at_period_end?: boolean;
	course_id?: string;
	plan_id?: string;
	interval?: 'monthly' | 'yearly';
	q?: string;
}

export type AnalyticsSummaryParams = Omit<
	AnalyticsSalesParams,
	'page' | 'per_page' | 'sort'
>;

// ─── Sale row ──────────────────────────────────────────────────────────────

export const analyticsSaleSchema = z.object({
	subscription_id: z.string(),
	status: analyticsSalesStatus,
	interval: z.enum(['monthly', 'yearly']),
	cancel_at_period_end: z.boolean(),
	created_at: z.string(),
	current_period_start: z.string(),
	current_period_end: z.string(),
	customer: z.object({
		id: z.string(),
		email: z.string(),
		name: z.string(),
		phone: z.string().nullable().optional(),
	}),
	course: z
		.object({
			id: z.string(),
			slug: z.string(),
			title: z.string(),
		})
		.nullable()
		.optional(),
	plan: z
		.object({
			id: z.string(),
			key: z.string(),
			name: z.string(),
		})
		.nullable()
		.optional(),
	price_cents: z.number().int(),
	mrr_cents: z.number().int(),
});
export type AnalyticsSale = z.infer<typeof analyticsSaleSchema>;

// ─── Paginated response ────────────────────────────────────────────────────

export const analyticsSalesResponseSchema = z.object({
	data: z.array(analyticsSaleSchema),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type AnalyticsSalesResponse = z.infer<
	typeof analyticsSalesResponseSchema
>;

// ─── Summary ───────────────────────────────────────────────────────────────

export const analyticsSummarySchema = z.object({
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
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
