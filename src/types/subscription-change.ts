import { z } from 'zod';

export const subscriptionChangePayloadSchema = z.object({
	productId: z.string().uuid(),
});

export type SubscriptionChangePayload = z.infer<
	typeof subscriptionChangePayloadSchema
>;

export const subscriptionChangeResponseSchema = z.object({
	subscriptionId: z.string(),
	status: z.string(),
	previousPlan: z.string(),
	newPlan: z.string(),
});

export type SubscriptionChangeResponse = z.infer<
	typeof subscriptionChangeResponseSchema
>;
