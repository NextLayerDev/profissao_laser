import { z } from 'zod';

export const courseSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	image_url: z.string().nullable().optional(),
	published: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Course = z.infer<typeof courseSchema>;

export const createCourseSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(80)
		.regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'slug em kebab-case'),
	title: z.string().min(1).max(200),
	description: z.string().max(2000).optional(),
	published: z.boolean().optional(),
});
export type CreateCoursePayload = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.partial();
export type UpdateCoursePayload = z.infer<typeof updateCourseSchema>;
