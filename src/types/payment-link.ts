import { z } from 'zod';

export const createPaymentLinkPayloadSchema = z.object({
	productId: z.string(),
	customerName: z.string().min(1),
	customerPhone: z.string().min(1),
	customerCpf: z.string().min(11),
	companyName: z.string().min(1),
	expiresAt: z.string().optional(),
});

export type CreatePaymentLinkPayload = z.infer<
	typeof createPaymentLinkPayloadSchema
>;

export const createPaymentLinkResponseSchema = z.object({
	id: z.string(),
	token: z.string(),
	url: z.string(),
	productName: z.string(),
	customerName: z.string(),
	status: z.string(),
	expiresAt: z.string().nullable(),
	createdAt: z.string(),
});

export type CreatePaymentLinkResponse = z.infer<
	typeof createPaymentLinkResponseSchema
>;

export const paymentLinkInfoSchema = z.object({
	token: z.string(),
	productName: z.string(),
	productDescription: z.string().nullable().optional(),
	productImage: z.string().nullable().optional(),
	originalPrice: z.number(),
	discountedPrice: z.number(),
	discountPercent: z.number(),
	customerName: z.string(),
	companyName: z.string(),
	status: z.string(),
	expiresAt: z.string().nullable(),
});

export type PaymentLinkInfo = z.infer<typeof paymentLinkInfoSchema>;

export const redeemPaymentLinkPayloadSchema = z.object({
	customerName: z.string().min(2),
	customerPhone: z.string().min(10),
	customerCpf: z.string().min(11),
	email: z.string().email(),
	password: z.string().min(6),
	companyName: z.string().min(1),
});

export type RedeemPaymentLinkPayload = z.infer<
	typeof redeemPaymentLinkPayloadSchema
>;

export const redeemPaymentLinkResponseSchema = z.object({
	checkoutUrl: z.string().url(),
	sessionId: z.string().optional(),
});

export type RedeemPaymentLinkResponse = z.infer<
	typeof redeemPaymentLinkResponseSchema
>;
