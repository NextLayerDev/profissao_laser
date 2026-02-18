import { z } from 'zod';

export const purchasePayloadSchema = z.object({
	productId: z.string().uuid(),
	amount: z.number(),
	recorrencia: z.enum(['one_time', 'month', 'year']),
});

export type PurchasePayload = z.infer<typeof purchasePayloadSchema>;

export const purchaseResponseSchema = z.object({
	id: z.string(),
	checkoutUrl: z.string().url(),
	status: z.string(),
	amount: z.number(),
	recorrencia: z.string(),
	productName: z.string(),
});

export type PurchaseResponse = z.infer<typeof purchaseResponseSchema>;
