import { z } from 'zod';

// ── Links de Plano (upvox /v1/plan-links) ─────────────────────────────────────

export const planLinkSchema = z.object({
	id: z.string(),
	token: z.string(),
	vox_grant: z.coerce.number(),
	status: z.enum(['active', 'disabled']),
	max_redemptions: z.number().int().nullable(),
	current_redemptions: z.number().int(),
	expires_at: z.string().nullable(),
	created_by: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type PlanLink = z.infer<typeof planLinkSchema>;

export const planLinkListItemSchema = planLinkSchema.extend({
	completed_redemptions: z.number().int(),
	created_by_name: z.string().nullable(),
});
export type PlanLinkListItem = z.infer<typeof planLinkListItemSchema>;

export interface CreatePlanLinkPayload {
	vox_grant: number;
	max_redemptions?: number;
	expires_at?: string;
}

// ── Vitrine pública do link ───────────────────────────────────────────────────

export const publicPlanLinkPlanSchema = z.object({
	key: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	price_monthly_cents: z.number().int(),
	first_month_cents: z.number().int(),
	discount_cents: z.number().int(),
	eligible: z.boolean(),
});
export type PublicPlanLinkPlan = z.infer<typeof publicPlanLinkPlanSchema>;

export const publicPlanLinkSchema = z.object({
	vox_grant: z.coerce.number(),
	status: z.enum(['ok', 'disabled', 'expired', 'exhausted']),
	plans: z.array(publicPlanLinkPlanSchema),
});
export type PublicPlanLink = z.infer<typeof publicPlanLinkSchema>;

// ── Fatura aberta da empresa ──────────────────────────────────────────────────

export const companyInvoiceEntrySchema = z.object({
	id: z.string(),
	/** link_tool_use = uso de tool por cliente de link; plan_grant = voxxys do plano (cobrados no ato). */
	source: z
		.enum(['link_tool_use', 'plan_grant'])
		.optional()
		.default('link_tool_use'),
	redemption_id: z.string().nullable(),
	plan_link_id: z.string().nullable(),
	plan_id: z.string().nullable().optional().default(null),
	plan_name: z.string().nullable().optional().default(null),
	customer_id: z.string(),
	customer_email: z.string().nullable(),
	customer_name: z.string().nullable(),
	tool_key: z.string().nullable(),
	tool_name: z.string().nullable(),
	invocation_id: z.string().nullable(),
	ref_id: z.string().nullable().optional().default(null),
	kind: z.enum(['accrual', 'reversal']),
	amount_cents: z.number().int(),
	voxes_spent: z.coerce.number(),
	created_at: z.string(),
});
export type CompanyInvoiceEntry = z.infer<typeof companyInvoiceEntrySchema>;

export const companyInvoiceSchema = z.object({
	entries: z.array(companyInvoiceEntrySchema),
	total: z.number().int(),
	totals: z.object({
		open_cents: z.number().int(),
		vox_granted: z.coerce.number(),
		/** Voxxys doados via planos (cobrados a R$1,20 no ato). */
		vox_granted_plans: z.coerce.number().optional().default(0),
		vox_rate_cents: z.number().int(),
	}),
});
export type CompanyInvoice = z.infer<typeof companyInvoiceSchema>;
