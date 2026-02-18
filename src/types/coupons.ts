import { z } from 'zod';

export const couponSchema = z.object({
	id: z.string(),
	percent_off: z.number().nullable(),
	amount_off: z.number().nullable(),
	currency: z.string().nullable(),
	duration: z.string(),
	duration_in_months: z.number().nullable(),
	max_redemptions: z.number().nullable(),
	redeem_by: z.string().nullable(),
	product_id: z.string(),
});

export type Coupon = z.infer<typeof couponSchema>;

export const createCouponPayloadSchema = z.object({
	product_id: z.string(),
	duration: z.enum(['once', 'repeating', 'forever']),
	percent_off: z.number().optional(),
	amount_off: z.number().optional(),
	duration_in_months: z.number().optional(),
	max_redemptions: z.number().optional(),
	redeem_by: z.string().optional(),
});

export type CreateCouponPayload = z.infer<typeof createCouponPayloadSchema>;
