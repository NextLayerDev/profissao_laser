import { z } from 'zod';

export const lessonSchema = z.object({
	id: z.string(),
	moduleId: z.string(),
	productId: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	videoUrl: z.string().nullable(),
	duration: z.number(),
	order: z.number(),
	isFree: z.boolean(),
});

export type Lesson = z.infer<typeof lessonSchema>;

export const moduleSchema = z.object({
	id: z.string(),
	productId: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	order: z.number(),
	lessons: z.array(lessonSchema),
});

export type Module = z.infer<typeof moduleSchema>;

export const createModulePayloadSchema = z.object({
	productId: z.string(),
	title: z.string(),
	description: z.string(),
	order: z.number(),
});

export type CreateModulePayload = z.infer<typeof createModulePayloadSchema>;

export const updateModulePayloadSchema = z.object({
	title: z.string(),
	description: z.string(),
	order: z.number(),
});

export type UpdateModulePayload = z.infer<typeof updateModulePayloadSchema>;

export const createLessonPayloadSchema = z.object({
	moduleId: z.string(),
	productId: z.string(),
	title: z.string(),
	description: z.string(),
	videoUrl: z.string(),
	duration: z.number(),
	order: z.number(),
	isFree: z.boolean(),
});

export type CreateLessonPayload = z.infer<typeof createLessonPayloadSchema>;

export const updateLessonPayloadSchema = z.object({
	title: z.string(),
	description: z.string(),
	videoUrl: z.string(),
	duration: z.number(),
	order: z.number(),
	isFree: z.boolean(),
});

export type UpdateLessonPayload = z.infer<typeof updateLessonPayloadSchema>;
