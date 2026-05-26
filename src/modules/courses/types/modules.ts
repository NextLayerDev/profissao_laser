import { z } from 'zod';

export const courseModuleSchema = z.object({
	id: z.string(),
	course_id: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	position: z.number().int(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type CourseModule = z.infer<typeof courseModuleSchema>;

export const createCourseModuleSchema = z.object({
	course_id: z.string(),
	title: z.string().min(1).max(200),
	description: z.string().max(2000).optional(),
	position: z.number().int().min(1).optional(),
});
export type CreateCourseModulePayload = z.infer<
	typeof createCourseModuleSchema
>;

export const updateCourseModuleSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(2000).optional(),
	position: z.number().int().min(1).optional(),
});
export type UpdateCourseModulePayload = z.infer<
	typeof updateCourseModuleSchema
>;
