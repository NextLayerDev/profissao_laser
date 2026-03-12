import { z } from 'zod';

export const purchasePayloadSchema = z.object({
	productId: z.string().uuid(),
});

export type PurchasePayload = z.infer<typeof purchasePayloadSchema>;

export const purchaseResponseSchema = z.object({
	id: z.string(),
	checkoutUrl: z.string().url(),
	status: z.string(),
	productName: z.string(),
});

export type PurchaseResponse = z.infer<typeof purchaseResponseSchema>;
