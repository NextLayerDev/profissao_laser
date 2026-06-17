import { z } from 'zod';

// ── Links de Plano (upvox /v1/plan-links) ─────────────────────────────────────

/** monthly_choice = comprador escolhe o plano (mensal); annual_fixed = plano travado, cobrança anual. */
export const planLinkKindSchema = z
	.enum(['monthly_choice', 'annual_fixed'])
	.default('monthly_choice');
export type PlanLinkKind = z.infer<typeof planLinkKindSchema>;

export const planLinkSchema = z.object({
	id: z.string(),
	token: z.string(),
	kind: planLinkKindSchema,
	plan_id: z.string().nullable().optional().default(null),
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
	plan_key: z.string().nullable().optional().default(null),
	plan_name: z.string().nullable().optional().default(null),
});
export type PlanLinkListItem = z.infer<typeof planLinkListItemSchema>;

export interface CreatePlanLinkPayload {
	kind?: PlanLinkKind;
	/** Obrigatório quando kind = annual_fixed (plano travado do link). */
	plan_key?: string;
	vox_grant: number;
	max_redemptions?: number;
	expires_at?: string;
}

// ── Vitrine pública do link ───────────────────────────────────────────────────

export const publicPlanLinkPlanSchema = z.object({
	key: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	/** Período da cobrança: mensal (links normais) ou anual (link de plano único). */
	interval: z.enum(['monthly', 'yearly']).optional().default('monthly'),
	price_cents: z.number().int().optional(),
	first_period_cents: z.number().int().optional(),
	// Legados (sempre presentes nos links mensais; ausentes nos anuais).
	price_monthly_cents: z.number().int().optional(),
	first_month_cents: z.number().int().optional(),
	discount_cents: z.number().int(),
	eligible: z.boolean(),
});
export type PublicPlanLinkPlan = z.infer<typeof publicPlanLinkPlanSchema>;

export const publicPlanLinkSchema = z.object({
	kind: planLinkKindSchema,
	vox_grant: z.coerce.number(),
	status: z.enum(['ok', 'disabled', 'expired', 'exhausted']),
	plans: z.array(publicPlanLinkPlanSchema),
});
export type PublicPlanLink = z.infer<typeof publicPlanLinkSchema>;

// ── Assinantes via links (resgates) ───────────────────────────────────────────

export const planLinkRedemptionSchema = z.object({
	id: z.string(),
	plan_link_id: z.string(),
	customer_id: z.string(),
	cpf: z.string().nullable(),
	plan_id: z.string().nullable(),
	status: z.enum(['pending', 'completed']),
	floor_cents: z.number().int(),
	amount_off_cents: z.number().int(),
	vox_grant: z.coerce.number(),
	vox_grant_remaining: z.coerce.number(),
	completed_at: z.string().nullable(),
	created_at: z.string(),
	customer_email: z.string().nullable(),
	customer_name: z.string().nullable(),
	plan_key: z.string().nullable(),
	plan_name: z.string().nullable(),
	link_token: z.string().nullable(),
	link_kind: planLinkKindSchema.nullable(),
});
export type PlanLinkRedemption = z.infer<typeof planLinkRedemptionSchema>;

export const planLinkRedemptionsSchema = z.object({
	rows: z.array(planLinkRedemptionSchema),
	total: z.number().int(),
});
export type PlanLinkRedemptions = z.infer<typeof planLinkRedemptionsSchema>;

// ── Fatura aberta da empresa ──────────────────────────────────────────────────

/**
 * link_tool_use   = uso de tool por cliente de link (custo de plataforma);
 * plan_grant      = voxxys do plano cobrados no ato (R$1,20/voxxy);
 * subscription_fee= 3,5% de cada pagamento de assinatura;
 * link_purchase   = 100% do 1º período pago numa compra por link.
 */
export const companyInvoiceSourceSchema = z.enum([
	'link_tool_use',
	'plan_grant',
	'subscription_fee',
	'link_purchase',
]);
export type CompanyInvoiceSource = z.infer<typeof companyInvoiceSourceSchema>;

export const companyInvoiceEntrySchema = z.object({
	id: z.string(),
	source: companyInvoiceSourceSchema.optional().default('link_tool_use'),
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
	/** Valor base sobre o qual a taxa incide (assinatura/piso). */
	base_amount_cents: z.number().int().nullable().optional().default(null),
	/** Taxa em basis points (350 = 3,5%; 10000 = 100%). */
	rate_bps: z.number().int().nullable().optional().default(null),
	voxes_spent: z.coerce.number(),
	created_at: z.string(),
});
export type CompanyInvoiceEntry = z.infer<typeof companyInvoiceEntrySchema>;

export const companyInvoiceSchema = z.object({
	entries: z.array(companyInvoiceEntrySchema),
	total: z.number().int(),
	totals: z.object({
		open_cents: z.number().int(),
		/** Quebra por origem (optional p/ retrocompat com API antiga). */
		tools_cents: z.number().int().optional().default(0),
		plan_grants_cents: z.number().int().optional().default(0),
		subscription_fees_cents: z.number().int().optional().default(0),
		link_purchases_cents: z.number().int().optional().default(0),
		vox_granted: z.coerce.number(),
		/** Voxxys doados via planos (cobrados a R$1,20 no ato). */
		vox_granted_plans: z.coerce.number().optional().default(0),
		vox_rate_cents: z.number().int(),
	}),
});
export type CompanyInvoice = z.infer<typeof companyInvoiceSchema>;
