import { z } from 'zod';

// --- Create global promo link (admin) ---
export const createGlobalPromoLinkPayloadSchema = z.object({
	discountPercent: z.number().min(1).max(100),
	durationMonths: z.number().min(1),
	maxRedemptions: z.number().min(1),
	expiresAt: z.string().optional(),
});

export type CreateGlobalPromoLinkPayload = z.infer<
	typeof createGlobalPromoLinkPayloadSchema
>;

export const createGlobalPromoLinkResponseSchema = z.object({
	id: z.string(),
	token: z.string(),
	url: z.string(),
	discountPercent: z.number(),
	durationMonths: z.number(),
	maxRedemptions: z.number(),
	status: z.string(),
	expiresAt: z.string().nullable(),
	createdAt: z.string(),
});

export type CreateGlobalPromoLinkResponse = z.infer<
	typeof createGlobalPromoLinkResponseSchema
>;

// --- Product within a global promo link ---
export const globalPromoLinkProductSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	image: z.string().nullable().optional(),
	originalPrice: z.number(),
	discountedPrice: z.number(),
});

export type GlobalPromoLinkProduct = z.infer<
	typeof globalPromoLinkProductSchema
>;

// --- Get global promo link info (public) ---
export const globalPromoLinkInfoSchema = z.object({
	token: z.string(),
	discountPercent: z.number(),
	durationMonths: z.number(),
	maxRedemptions: z.number(),
	currentRedemptions: z.number(),
	remainingRedemptions: z.number(),
	status: z.string(),
	expiresAt: z.string().nullable(),
	products: z.array(globalPromoLinkProductSchema),
});

export type GlobalPromoLinkInfo = z.infer<typeof globalPromoLinkInfoSchema>;

// --- Redeem global promo link (public) ---
export const redeemGlobalPromoLinkPayloadSchema = z.object({
	productId: z.string(),
	customerName: z.string().min(2),
	customerPhone: z.string().min(10),
	customerCpf: z.string().min(11),
	email: z.string().email(),
	password: z.string().min(6),
	companyName: z.string().min(1),
});

export type RedeemGlobalPromoLinkPayload = z.infer<
	typeof redeemGlobalPromoLinkPayloadSchema
>;

export const redeemGlobalPromoLinkResponseSchema = z.object({
	checkoutUrl: z.string().url(),
	sessionId: z.string().optional(),
});

export type RedeemGlobalPromoLinkResponse = z.infer<
	typeof redeemGlobalPromoLinkResponseSchema
>;

// --- List global promo links (admin) ---
export const globalPromoLinkListItemSchema = z.object({
	id: z.string(),
	token: z.string(),
	discountPercent: z.number(),
	durationMonths: z.number(),
	maxRedemptions: z.number(),
	currentRedemptions: z.number(),
	status: z.string(),
	expiresAt: z.string().nullable(),
	createdBy: z.string().nullable(),
	createdAt: z.string(),
});

export type GlobalPromoLinkListItem = z.infer<
	typeof globalPromoLinkListItemSchema
>;
