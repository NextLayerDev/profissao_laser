import { z } from 'zod';

export const courseLessonSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	videoUrl: z.string().nullable(),
	duration: z.number().nullable(),
	order: z.number(),
	isFree: z.boolean(),
});

export type CourseLesson = z.infer<typeof courseLessonSchema>;

export const courseModuleSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	order: z.number(),
	lessons: z.array(courseLessonSchema),
});

export type CourseModule = z.infer<typeof courseModuleSchema>;

export const courseSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	image: z.string().nullable(),
	slug: z.string(),
	modules: z.array(courseModuleSchema),
});

export type Course = z.infer<typeof courseSchema>;
