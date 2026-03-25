import { z } from 'zod';

export const customerSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	phone: z.string().nullable().optional(),
	banned: z.boolean().default(false),
});

export type Customer = z.infer<typeof customerSchema>;
