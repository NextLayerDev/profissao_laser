import { z } from 'zod';

export const materialSchema = z.object({
	id: z.string(),
	lesson_id: z.string(),
	filename: z.string(),
	file_url: z.string(),
	mime: z.string().nullable().optional(),
	size_bytes: z.number().int().nullable().optional(),
	position: z.number().int(),
	created_at: z.string(),
	updated_at: z.string().optional(),
});
export type Material = z.infer<typeof materialSchema>;
