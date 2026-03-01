import { z } from 'zod';

export const quizOptionSchema = z.object({
	id: z.string().uuid(),
	text: z.string(),
	isCorrect: z.boolean(),
});

export const quizQuestionSchema = z.object({
	id: z.string().uuid(),
	text: z.string(),
	order: z.number(),
	options: quizOptionSchema.array(),
});

export const quizSchema = z.object({
	id: z.string().uuid(),
	lessonId: z.string(),
	title: z.string(),
	createdAt: z.string(),
	questions: quizQuestionSchema.array(),
});

export type QuizOption = z.infer<typeof quizOptionSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Quiz = z.infer<typeof quizSchema>;

export interface CreateQuestionPayload {
	text: string;
	order: number;
	options: { text: string; isCorrect: boolean }[];
}
