import { z } from 'zod';

// --- Create promo link (admin) ---
export const createPromoLinkPayloadSchema = z.object({
	productId: z.string(),
	maxRedemptions: z.number().min(1),
	discountPercent: z.number().min(1).max(100),
	durationMonths: z.number().min(1),
	expiresAt: z.string().optional(),
});

export type CreatePromoLinkPayload = z.infer<
	typeof createPromoLinkPayloadSchema
>;

export const createPromoLinkResponseSchema = z.object({
	id: z.string(),
	token: z.string(),
	url: z.string(),
	productName: z.string(),
	discountPercent: z.number(),
	maxRedemptions: z.number(),
	durationMonths: z.number(),
	status: z.string(),
	expiresAt: z.string().nullable(),
	createdAt: z.string(),
});

export type CreatePromoLinkResponse = z.infer<
	typeof createPromoLinkResponseSchema
>;

// --- Get promo link info (public) ---
export const promoLinkInfoSchema = z.object({
	token: z.string(),
	productName: z.string(),
	productDescription: z.string().nullable().optional(),
	productImage: z.string().nullable().optional(),
	originalPrice: z.number(),
	discountedPrice: z.number(),
	discountPercent: z.number(),
	durationMonths: z.number(),
	maxRedemptions: z.number(),
	currentRedemptions: z.number(),
	remainingRedemptions: z.number(),
	status: z.string(),
	expiresAt: z.string().nullable(),
});

export type PromoLinkInfo = z.infer<typeof promoLinkInfoSchema>;

// --- Redeem promo link (public) ---
export const redeemPromoLinkPayloadSchema = z.object({
	customerName: z.string().min(2),
	customerPhone: z.string().min(10),
	customerCpf: z.string().min(11),
	email: z.string().email(),
	password: z.string().min(6),
	companyName: z.string().min(1),
});

export type RedeemPromoLinkPayload = z.infer<
	typeof redeemPromoLinkPayloadSchema
>;

export const redeemPromoLinkResponseSchema = z.object({
	checkoutUrl: z.string().url(),
	sessionId: z.string().optional(),
});

export type RedeemPromoLinkResponse = z.infer<
	typeof redeemPromoLinkResponseSchema
>;

// --- List promo links (admin) ---
export const promoLinkListItemSchema = z.object({
	id: z.string(),
	token: z.string(),
	productName: z.string(),
	discountPercent: z.number(),
	durationMonths: z.number(),
	maxRedemptions: z.number(),
	currentRedemptions: z.number(),
	status: z.string(),
	expiresAt: z.string().nullable(),
	createdBy: z.string().nullable(),
	createdAt: z.string(),
});

export type PromoLinkListItem = z.infer<typeof promoLinkListItemSchema>;
