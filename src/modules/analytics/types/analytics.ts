import { z } from 'zod';

const customerRefSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
});

// ---- Sales analytics ----

export const salesRowSchema = z.object({
	subscription_id: z.string(),
	status: z.enum(['trialing', 'active', 'past_due', 'canceled', 'paused']),
	interval: z.enum(['monthly', 'yearly']),
	cancel_at_period_end: z.boolean(),
	created_at: z.string(),
	current_period_start: z.string(),
	current_period_end: z.string(),
	customer: customerRefSchema,
	plan: z.object({ id: z.string(), key: z.string(), name: z.string() }),
	price_cents: z.number().int(),
	mrr_cents: z.number().int(),
});
export type SalesRow = z.infer<typeof salesRowSchema>;

export const salesAnalyticsSchema = z.object({
	data: salesRowSchema.array(),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type SalesAnalytics = z.infer<typeof salesAnalyticsSchema>;

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

export interface SalesAnalyticsParams {
	from?: string;
	to?: string;
	date_field?: 'created_at' | 'current_period_end';
	status?: string;
	cancel_at_period_end?: boolean;
	plan_id?: string;
	interval?: 'monthly' | 'yearly';
	q?: string;
	page?: number;
	per_page?: number;
	sort?:
		| 'created_at:asc'
		| 'created_at:desc'
		| 'current_period_end:asc'
		| 'current_period_end:desc';
}

// ---- Voxes analytics ----

export const voxesRowSchema = z.object({
	ledger_id: z.string(),
	created_at: z.string(),
	vox_amount: z.number().int(),
	price_cents: z.number().int().nullable().optional(),
	stripe_session_id: z.string().nullable().optional(),
	customer: customerRefSchema,
	vox_package: z.object({
		id: z.string(),
		name: z.string(),
		vox_amount: z.number().int(),
		price_cents: z.number().int(),
	}),
});
export type VoxesRow = z.infer<typeof voxesRowSchema>;

export const voxesAnalyticsSchema = z.object({
	data: voxesRowSchema.array(),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type VoxesAnalytics = z.infer<typeof voxesAnalyticsSchema>;

export const voxesSummarySchema = z.object({
	sales_count: z.number().int(),
	voxes_sold: z.number().int(),
	revenue_cents: z.number().int(),
	by_package: z
		.object({
			vox_package_id: z.string().nullable().optional(),
			package_name: z.string().nullable().optional(),
			sales_count: z.number().int(),
			voxes_sold: z.number().int(),
			revenue_cents: z.number().int(),
		})
		.array(),
});
export type VoxesSummary = z.infer<typeof voxesSummarySchema>;

export interface VoxesAnalyticsParams {
	from?: string;
	to?: string;
	vox_package_id?: string;
	customer_id?: string;
	q?: string;
	page?: number;
	per_page?: number;
	sort?: 'created_at:asc' | 'created_at:desc';
}
