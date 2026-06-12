import { z } from 'zod';

export const lessonSchema = z.object({
	id: z.string(),
	module_id: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	body_md: z.string().nullable().optional(),
	video_id: z.string().nullable().optional(),
	video_playback_url: z.string().nullable().optional(),
	duration_seconds: z.number().int().nullable().optional(),
	position: z.number().int(),
	is_free: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const createLessonSchema = z.object({
	module_id: z.string(),
	title: z.string().min(1).max(200),
	description: z.string().max(2000).optional(),
	body_md: z.string().optional(),
	position: z.number().int().min(1).optional(),
	is_free: z.boolean().optional(),
});
export type CreateLessonPayload = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(2000).optional(),
	body_md: z.string().optional(),
	position: z.number().int().min(1).optional(),
	is_free: z.boolean().optional(),
});
export type UpdateLessonPayload = z.infer<typeof updateLessonSchema>;

/** Entrada do índice plano de aulas (GET /v1/admin/lessons-index). */
export const lessonIndexEntrySchema = z.object({
	id: z.string(),
	title: z.string(),
	position: z.number().int(),
	module: z.object({
		id: z.string(),
		title: z.string(),
		position: z.number().int(),
	}),
	course: z.object({
		id: z.string(),
		title: z.string(),
		slug: z.string(),
	}),
});
export type LessonIndexEntry = z.infer<typeof lessonIndexEntrySchema>;
