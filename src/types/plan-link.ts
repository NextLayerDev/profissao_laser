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
	/** Nº de usos somados (>1 nas linhas de uso de ferramenta agrupadas por cliente). */
	count: z.coerce.number().int().optional().default(1),
	created_at: z.string(),
});
export type CompanyInvoiceEntry = z.infer<typeof companyInvoiceEntrySchema>;

/** Bruta × repasse × líquido de um mês. */
export const monthlyFinanceSchema = z.object({
	month: z.string(),
	gross_cents: z.number().int(),
	repasse_cents: z.number().int(),
	net_cents: z.number().int(),
});
export type MonthlyFinance = z.infer<typeof monthlyFinanceSchema>;

/** Cliente no ranking de receita do financeiro. */
export const topCustomerSchema = z.object({
	customer_id: z.string(),
	customer_name: z.string().nullable(),
	customer_email: z.string().nullable(),
	gross_cents: z.number().int(),
	repasse_cents: z.number().int(),
	net_cents: z.number().int(),
});
export type TopCustomer = z.infer<typeof topCustomerSchema>;

/** Lastro de voxxys comprados por cliente. */
export const voxxyLastroCustomerSchema = z.object({
	customer_id: z.string(),
	customer_name: z.string().nullable(),
	customer_email: z.string().nullable(),
	sold_cents: z.number().int(),
	used_voxes: z.coerce.number(),
	used_value_cents: z.number().int(),
	upvox_share_cents: z.number().int(),
	company_share_cents: z.number().int(),
	lastro_cents: z.number().int(),
});
export type VoxxyLastroCustomer = z.infer<typeof voxxyLastroCustomerSchema>;

/** Economia dos voxxys COMPRADOS: vendido = usado + lastro; usado divide 50/50. */
export const voxxyLastroSchema = z.object({
	sold_cents: z.number().int().optional().default(0),
	used_value_cents: z.number().int().optional().default(0),
	upvox_share_cents: z.number().int().optional().default(0),
	company_share_cents: z.number().int().optional().default(0),
	lastro_cents: z.number().int().optional().default(0),
	per_customer: z.array(voxxyLastroCustomerSchema).optional().default([]),
});
export type VoxxyLastro = z.infer<typeof voxxyLastroSchema>;

/** Sugestão da análise IA do financeiro. */
export const financeSuggestionSchema = z.object({
	titulo: z.string(),
	detalhe: z.string(),
	impacto: z.enum(['alto', 'medio', 'baixo']),
});
export type FinanceSuggestion = z.infer<typeof financeSuggestionSchema>;

export const financeAnalysisSchema = z.object({
	model: z.string(),
	resumo: z.string(),
	sugestoes: z.array(financeSuggestionSchema),
});
export type FinanceAnalysis = z.infer<typeof financeAnalysisSchema>;

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
		/** Receita bruta dos alunos na janela (pagamentos reais). */
		gross_revenue_cents: z.number().int().optional().default(0),
		/** Líquido da empresa do curso = bruta − repasse total. */
		company_net_cents: z.number().int().optional().default(0),
		/** 50% da upvox sobre voxxys comprados usados (entra no repasse). */
		vox_purchase_use_cents: z.number().int().optional().default(0),
		vox_granted: z.coerce.number(),
		/** Voxxys doados via planos (cobrados a R$1,20 no ato). */
		vox_granted_plans: z.coerce.number().optional().default(0),
		vox_rate_cents: z.number().int(),
	}),
	/** Levantamento mês a mês (optional p/ retrocompat com API antiga). */
	monthly: z.array(monthlyFinanceSchema).optional().default([]),
	/** Ranking de clientes por receita (optional p/ retrocompat). */
	top_customers: z.array(topCustomerSchema).optional().default([]),
	/** Lastro de voxxys comprados (optional p/ retrocompat). */
	voxxy_lastro: voxxyLastroSchema.optional(),
});
export type CompanyInvoice = z.infer<typeof companyInvoiceSchema>;
