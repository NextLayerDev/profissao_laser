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
	sale_value_cents: z.number().int(),
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
	interval?: 'month' | 'year';
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
	vox_package: z
		.object({
			id: z.string(),
			name: z.string(),
			vox_amount: z.number().int(),
			price_cents: z.number().int(),
		})
		.nullable()
		.optional(),
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

// ---- Invoices analytics ----

export const billingReasonSchema = z.enum([
	'subscription_create',
	'subscription_cycle',
	'subscription_update',
	'manual',
	'refund',
]);
export type BillingReason = z.infer<typeof billingReasonSchema>;

export const invoiceRowSchema = z.object({
	id: z.string(),
	stripe_invoice_id: z.string(),
	billing_reason: billingReasonSchema,
	amount_cents: z.number().int(),
	paid_at: z.string(),
	customer: customerRefSchema,
	plan: z
		.object({ id: z.string(), key: z.string(), name: z.string() })
		.nullable()
		.optional(),
	period_start: z.string().nullable().optional(),
	period_end: z.string().nullable().optional(),
});
export type InvoiceRow = z.infer<typeof invoiceRowSchema>;

export const invoicesAnalyticsSchema = z.object({
	data: invoiceRowSchema.array(),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type InvoicesAnalytics = z.infer<typeof invoicesAnalyticsSchema>;

const invoiceReasonStatsSchema = z.object({
	count: z.number().int(),
	revenue_cents: z.number().int(),
});

export const invoicesSummarySchema = z.object({
	total_count: z.number().int(),
	total_revenue_cents: z.number().int(),
	by_reason: z.object({
		subscription_create: invoiceReasonStatsSchema,
		subscription_cycle: invoiceReasonStatsSchema,
		subscription_update: invoiceReasonStatsSchema,
		manual: invoiceReasonStatsSchema,
		refund: invoiceReasonStatsSchema,
	}),
});
export type InvoicesSummary = z.infer<typeof invoicesSummarySchema>;

export interface InvoicesAnalyticsParams {
	billing_reason?: BillingReason;
	from?: string;
	to?: string;
	plan_id?: string;
	interval?: 'month' | 'year';
	customer_id?: string;
	q?: string;
	page?: number;
	per_page?: number;
}

// ---- Failed payments ----

export const failedPaymentRowSchema = z.object({
	id: z.string(),
	subscription_id: z.string().nullable().optional(),
	stripe_invoice_id: z.string(),
	billing_reason: billingReasonSchema,
	amount_cents: z.number().int(),
	interval: z.enum(['monthly', 'yearly']),
	period_start: z.string().nullable().optional(),
	period_end: z.string().nullable().optional(),
	created_at: z.string(),
	customer: customerRefSchema,
	plan: z
		.object({ id: z.string(), key: z.string(), name: z.string() })
		.nullable()
		.optional(),
});
export type FailedPaymentRow = z.infer<typeof failedPaymentRowSchema>;

export const failedPaymentsAnalyticsSchema = z.object({
	data: failedPaymentRowSchema.array(),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type FailedPaymentsAnalytics = z.infer<
	typeof failedPaymentsAnalyticsSchema
>;

export interface FailedPaymentsAnalyticsParams {
	billing_reason?: BillingReason;
	from?: string;
	to?: string;
	plan_id?: string;
	interval?: 'month' | 'year';
	customer_id?: string;
	q?: string;
	page?: number;
	per_page?: number;
}

// ---- Entries (entradas) ----

export const entryTypeSchema = z.enum(['subscription', 'vox']);
export type EntryType = z.infer<typeof entryTypeSchema>;

export const entryRowSchema = z.object({
	entry_type: entryTypeSchema,
	id: z.string(),
	occurred_at: z.string(),
	amount_cents: z.number().int(),
	customer: customerRefSchema,
	subscription: z
		.object({
			subscription_id: z.string().optional(),
			billing_reason: billingReasonSchema,
			interval: z.enum(['monthly', 'yearly']),
			plan: z.object({ id: z.string(), key: z.string(), name: z.string() }),
			status: z.enum(['paid', 'payment_failed', 'refunded']).optional(),
		})
		.nullable()
		.optional(),
	vox: z
		.object({
			package_id: z.string().nullable().optional(),
			package_name: z.string().nullable().optional(),
			vox_amount: z.number().int(),
		})
		.nullable()
		.optional(),
});
export type EntryRow = z.infer<typeof entryRowSchema>;

export const entriesAnalyticsSchema = z.object({
	data: entryRowSchema.array(),
	page: z.number().int(),
	per_page: z.number().int(),
	total: z.number().int(),
	total_pages: z.number().int(),
});
export type EntriesAnalytics = z.infer<typeof entriesAnalyticsSchema>;

export interface EntriesAnalyticsParams {
	from?: string;
	to?: string;
	entry_type?: EntryType;
	customer_id?: string;
	q?: string;
	page?: number;
	per_page?: number;
	sort?: 'occurred_at:asc' | 'occurred_at:desc';
}

// ---- Refunds ----

export const refundTypeSchema = z.enum(['subscription', 'vox_purchase']);
export type RefundType = z.infer<typeof refundTypeSchema>;

export const refundRowSchema = z.object({
	id: z.string(),
	customer: z.object({
		id: z.string(),
		email: z.string(),
		name: z.string(),
	}),
	stripe_refund_id: z.string(),
	stripe_charge_id: z.string(),
	amount_cents: z.number().int(),
	type: refundTypeSchema,
	created_at: z.string(),
});
export type RefundRow = z.infer<typeof refundRowSchema>;
