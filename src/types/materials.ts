import { z } from 'zod';

export const materialTypeSchema = z.enum(['pdf', 'word', 'image']);
export type MaterialType = z.infer<typeof materialTypeSchema>;

export const materialSchema = z.object({
	id: z.string().uuid(),
	lessonId: z.string(),
	name: z.string(),
	url: z.string(),
	type: materialTypeSchema,
	createdAt: z.string(),
});

export type Material = z.infer<typeof materialSchema>;
