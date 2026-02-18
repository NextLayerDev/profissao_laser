import { z } from 'zod';

export const createSubscriptionPayloadSchema = z.object({
	email: z.string().email(),
	stripeProductId: z.string().min(1),
	amount: z.number().min(0),
	interval: z.enum(['day', 'week', 'month', 'year']),
	intervalCount: z.number().int().min(1),
	endsAt: z.string(),
});

export type CreateSubscriptionPayload = z.infer<
	typeof createSubscriptionPayloadSchema
>;
