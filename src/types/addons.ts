import { z } from 'zod';

export const createAddonPayloadSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	price: z.number().positive(),
	interval: z.enum(['month', 'year', 'one_time']).default('month'),
});

export type CreateAddonPayload = z.infer<typeof createAddonPayloadSchema>;

export const subscriptionAddonItemSchema = z.object({
	itemId: z.string(),
	productId: z.uuid(),
	productName: z.string(),
	stripePriceId: z.string(),
	quantity: z.number().int().positive(),
	subscriptionId: z.string().optional(),
});

export type SubscriptionAddonItem = z.infer<typeof subscriptionAddonItemSchema>;

export const removeAddonResponseSchema = z.object({
	removed: z.literal(true),
	itemId: z.string(),
});

export type RemoveAddonResponse = z.infer<typeof removeAddonResponseSchema>;
