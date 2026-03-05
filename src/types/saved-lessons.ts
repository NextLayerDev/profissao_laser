import { z } from 'zod';

export const savedLessonLessonSchema = z.object({
	id: z.string(),
	title: z.string(),
	duration: z.number().nullable(),
	videoUrl: z.string().nullable(),
});

export const savedLessonSchema = z.object({
	id: z.string(),
	lessonId: z.string(),
	lesson: savedLessonLessonSchema,
	courseSlug: z.string(),
	courseName: z.string(),
});

export type SavedLessonLesson = z.infer<typeof savedLessonLessonSchema>;
export type SavedLesson = z.infer<typeof savedLessonSchema>;
export type SavedLessonsResponse = SavedLesson[];
