import { z } from 'zod';

// Módulo NOVO de cupons (upvox `/v1/coupons/*`). Não confundir com os cupons
// legados por produto (`src/types/coupons.ts`, main API antiga).

export const couponDiscountTypeSchema = z.enum(['percent', 'fixed']);
export type CouponDiscountType = z.infer<typeof couponDiscountTypeSchema>;

export const couponAppliesToSchema = z.enum(['all', 'plans', 'voxes']);
export type CouponAppliesTo = z.infer<typeof couponAppliesToSchema>;

export const couponDurationSchema = z.enum(['once', 'repeating', 'forever']);
export type CouponDuration = z.infer<typeof couponDurationSchema>;

export const couponContextSchema = z.enum(['plan', 'vox']);
export type CouponContext = z.infer<typeof couponContextSchema>;

export const couponRedemptionStatusSchema = z.enum([
	'pending',
	'completed',
	'expired',
]);
export type CouponRedemptionStatus = z.infer<
	typeof couponRedemptionStatusSchema
>;

export const couponSchema = z.object({
	id: z.string(),
	code: z.string(),
	discount_type: couponDiscountTypeSchema,
	percent_off: z.number().nullable(),
	amount_off_cents: z.number().nullable(),
	applies_to: couponAppliesToSchema,
	duration: couponDurationSchema,
	duration_in_months: z.number().nullable(),
	max_uses: z.number().nullable(),
	max_uses_per_customer: z.number().nullable(),
	starts_at: z.string().nullable(),
	expires_at: z.string().nullable(),
	active: z.boolean(),
	stripe_coupon_id: z.string().nullable(),
	created_by: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Coupon = z.infer<typeof couponSchema>;

export const couponListItemSchema = couponSchema.extend({
	uses_completed: z.number(),
	uses_pending: z.number(),
	total_discount_cents: z.number(),
});
export type CouponListItem = z.infer<typeof couponListItemSchema>;

export const couponRedemptionSchema = z.object({
	id: z.string(),
	customer_id: z.string(),
	customer_name: z.string().nullable(),
	customer_email: z.string().nullable(),
	kind: couponContextSchema,
	plan_id: z.string().nullable(),
	vox_package_id: z.string().nullable(),
	status: couponRedemptionStatusSchema,
	discount_cents: z.number().nullable(),
	amount_total_cents: z.number().nullable(),
	created_at: z.string(),
	completed_at: z.string().nullable(),
});
export type CouponRedemption = z.infer<typeof couponRedemptionSchema>;

export interface CreateCouponPayload {
	code: string;
	discount_type: CouponDiscountType;
	percent_off?: number;
	amount_off_cents?: number;
	applies_to: CouponAppliesTo;
	duration: CouponDuration;
	duration_in_months?: number;
	max_uses?: number;
	max_uses_per_customer?: number;
	starts_at?: string;
	expires_at?: string;
	active: boolean;
}
export type UpdateCouponPayload = Partial<CreateCouponPayload>;

export interface ValidateCouponPayload {
	code: string;
	context: CouponContext;
	plan_key?: string;
	interval?: 'monthly' | 'yearly';
	vox_package_id?: string;
}

export const validateCouponResultSchema = z.discriminatedUnion('valid', [
	z.object({
		valid: z.literal(true),
		code: z.string(),
		discount_type: couponDiscountTypeSchema,
		percent_off: z.number().nullable(),
		amount_off_cents: z.number().nullable(),
		duration: couponDurationSchema,
		duration_in_months: z.number().nullable(),
		original_total_cents: z.number(),
		discount_cents: z.number(),
		discounted_total_cents: z.number(),
	}),
	z.object({ valid: z.literal(false), reason: z.string() }),
]);
export type ValidateCouponResult = z.infer<typeof validateCouponResultSchema>;

/** Mensagens PT-BR para os motivos de rejeição do cupom. */
export const COUPON_REASON_LABELS: Record<string, string> = {
	not_found: 'Cupom não encontrado.',
	inactive: 'Este cupom está inativo.',
	not_started: 'Este cupom ainda não começou.',
	expired: 'Este cupom expirou.',
	wrong_context: 'Este cupom não vale para esta compra.',
	max_uses_reached: 'Este cupom atingiu o limite de usos.',
	customer_limit_reached: 'Você já usou este cupom o número máximo de vezes.',
	discount_exceeds_price: 'O desconto é maior que o valor da compra.',
};

export function couponReasonLabel(reason: string): string {
	return COUPON_REASON_LABELS[reason] ?? 'Cupom inválido.';
}
