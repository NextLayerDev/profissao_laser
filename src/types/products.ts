import { z } from 'zod';

export const productSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	type: z.string(),
	description: z.string().nullable(),
	image: z.string().nullable(),
	price: z.number(),
	status: z.enum(['ativo', 'excluido']),
	slug: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	language: z.string(),
	country: z.string(),
	category: z.string().nullable(),
	refundDays: z.number().nullable(),
	stripeProductId: z.string().nullable(),
	stripePriceId: z.string().nullable(),
});

export type Product = z.infer<typeof productSchema>;
