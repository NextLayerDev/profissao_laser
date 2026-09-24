import { z } from 'zod';

/** Resposta da upvox (`/v1/me/saved-lessons`) — snake_case, com contexto. */
export const savedLessonApiSchema = z.object({
	id: z.string(),
	lesson_id: z.string(),
	created_at: z.string(),
	lesson: z.object({
		id: z.string(),
		title: z.string(),
		duration_seconds: z.number().nullable(),
		position: z.number(),
		is_free: z.boolean(),
	}),
	module: z.object({
		id: z.string(),
		title: z.string(),
		position: z.number(),
	}),
	course: z.object({
		id: z.string(),
		title: z.string(),
		slug: z.string(),
	}),
});
export type SavedLessonApi = z.infer<typeof savedLessonApiSchema>;

/** Forma que a UI consome (sala de aula + modal de salvas). */
export interface SavedLesson {
	id: string;
	lessonId: string;
	lesson: {
		id: string;
		title: string;
		duration: number | null;
	};
	courseSlug: string;
	courseName: string;
}

export type SavedLessonsResponse = SavedLesson[];
