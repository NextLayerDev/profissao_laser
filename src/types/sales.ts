import { z } from 'zod';

export const salesSchema = z.object({
	id: z.string(),
	date: z.string(),
	amount: z.number(),
	currency: z.string().nullable(),
	status: z.string(),
	product: z.string(),
	customer: z.object({
		name: z.string(),
		email: z.string(),
	}),
	receipt_url: z.string().nullable(),
});

export type Sales = z.infer<typeof salesSchema>;
