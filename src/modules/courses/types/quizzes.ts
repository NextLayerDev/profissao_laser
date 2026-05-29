import { z } from 'zod';

/**
 * Opção de questão. No detalhe do quiz (visão do aluno) `is_correct` não vem;
 * já nas respostas de criar/editar questão (visão admin) ele é incluído.
 */
export const quizOptionSchema = z.object({
	id: z.string(),
	question_id: z.string(),
	text: z.string(),
	is_correct: z.boolean().optional(),
	position: z.number().int(),
});
export type QuizOption = z.infer<typeof quizOptionSchema>;

export const quizQuestionSchema = z.object({
	id: z.string(),
	quiz_id: z.string(),
	prompt: z.string(),
	position: z.number().int(),
	options: quizOptionSchema.array(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizSchema = z.object({
	id: z.string(),
	lesson_id: z.string(),
	title: z.string(),
	pass_threshold_pct: z.number().int(),
	created_at: z.string(),
	updated_at: z.string(),
	questions: quizQuestionSchema.array().optional(),
});
export type Quiz = z.infer<typeof quizSchema>;

export const createQuizSchema = z.object({
	title: z.string().min(1).max(200),
	pass_threshold_pct: z.number().int().min(0).max(100).optional(),
});
export type CreateQuizPayload = z.infer<typeof createQuizSchema>;

export const createQuestionSchema = z.object({
	quiz_id: z.string(),
	prompt: z.string().min(1),
	position: z.number().int().optional(),
	options: z
		.object({
			text: z.string().min(1),
			is_correct: z.boolean(),
			position: z.number().int(),
		})
		.array()
		.min(2),
});
export type CreateQuestionPayload = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = z.object({
	prompt: z.string().min(1).optional(),
	position: z.number().int().optional(),
	options: z
		.object({
			text: z.string().min(1),
			is_correct: z.boolean(),
			position: z.number().int(),
		})
		.array()
		.optional(),
});
export type UpdateQuestionPayload = z.infer<typeof updateQuestionSchema>;

export const quizAttemptResultSchema = z.object({
	correct: z.number().int(),
	total: z.number().int(),
	score_pct: z.number(),
	passed: z.boolean(),
});
export type QuizAttemptResult = z.infer<typeof quizAttemptResultSchema>;

export interface QuizAttemptAnswer {
	question_id: string;
	option_id: string;
}
