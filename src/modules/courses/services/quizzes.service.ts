import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type CreateQuestionPayload,
	type CreateQuizPayload,
	type Quiz,
	type QuizAttemptAnswer,
	type QuizAttemptResult,
	type QuizQuestion,
	quizAttemptResultSchema,
	quizQuestionSchema,
	quizSchema,
	type UpdateQuestionPayload,
} from '../types/quizzes';

/** Detalhe do quiz da lição (com questões e opções). 404 → sem quiz. */
export async function getLessonQuiz(lessonId: string): Promise<Quiz | null> {
	try {
		const { data } = await api.get(`/v1/lesson/${lessonId}/quiz`);
		return quizSchema.parse(data);
	} catch (err: unknown) {
		if ((err as { response?: { status?: number } })?.response?.status === 404)
			return null;
		throw err;
	}
}

export async function createLessonQuiz(
	lessonId: string,
	payload: CreateQuizPayload,
): Promise<Quiz> {
	const { data } = await api.post(`/v1/lesson/${lessonId}/quiz`, payload);
	return quizSchema.parse(data);
}

export async function attemptLessonQuiz(
	lessonId: string,
	answers: QuizAttemptAnswer[],
): Promise<QuizAttemptResult> {
	const { data } = await api.post(`/v1/lesson/${lessonId}/quiz/attempt`, {
		answers,
	});
	return quizAttemptResultSchema.parse(data);
}

export async function deleteQuiz(quizId: string): Promise<void> {
	await api.delete(`/v1/quiz/${quizId}`);
}

export async function createQuestion(
	quizId: string,
	payload: CreateQuestionPayload,
): Promise<QuizQuestion> {
	const { data } = await api.post(`/v1/quiz/${quizId}/question`, payload);
	return quizQuestionSchema.parse(data);
}

export async function updateQuestion(
	questionId: string,
	payload: UpdateQuestionPayload,
): Promise<QuizQuestion> {
	const { data } = await api.patch(`/v1/question/${questionId}`, payload);
	return quizQuestionSchema.parse(data);
}

export async function deleteQuestion(questionId: string): Promise<void> {
	await api.delete(`/v1/question/${questionId}`);
}
