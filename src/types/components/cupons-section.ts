import { z } from 'zod';

export const cuponsSectionPropsSchema = z.object({
	product: z.object({
		id: z.string(),
		name: z.string(),
	}),
});

export type CuponsSectionProps = z.infer<typeof cuponsSectionPropsSchema>;
