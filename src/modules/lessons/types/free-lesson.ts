import { z } from 'zod';

/** Aula grátis (GET /v1/lessons/free) — já ordenada por curso → módulo → posição. */
export const freeLessonSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	video_playback_url: z.string().nullable(),
	duration_seconds: z.number().nullable().optional(),
	position: z.number(),
	module: z.object({
		id: z.string(),
		title: z.string(),
		position: z.number(),
	}),
	course: z.object({
		id: z.string(),
		title: z.string(),
		slug: z.string(),
		image_url: z.string().nullable().optional(),
	}),
});
export type FreeLesson = z.infer<typeof freeLessonSchema>;
