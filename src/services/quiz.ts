import { api } from '@/lib/fetch';
import {
	type CreateQuestionPayload,
	type Quiz,
	type QuizQuestion,
	quizQuestionSchema,
	quizSchema,
} from '@/types/quiz';

export async function getLessonQuiz(lessonId: string): Promise<Quiz | null> {
	try {
		const { data } = await api.get(`/lesson/${lessonId}/quiz`);
		return quizSchema.parse(data);
	} catch (err: unknown) {
		if ((err as { response?: { status?: number } })?.response?.status === 404)
			return null;
		throw err;
	}
}

export async function createLessonQuiz(
	lessonId: string,
	title: string,
): Promise<Quiz> {
	const { data } = await api.post(`/lesson/${lessonId}/quiz`, { title });
	return quizSchema.parse({ ...data, questions: [] });
}

export async function deleteLessonQuiz(quizId: string): Promise<void> {
	await api.delete(`/quiz/${quizId}`);
}

export async function createQuestion(
	quizId: string,
	payload: CreateQuestionPayload,
): Promise<QuizQuestion> {
	const { data } = await api.post(`/quiz/${quizId}/question`, payload);
	return quizQuestionSchema.parse(data);
}

export async function updateQuestion(
	questionId: string,
	payload: Partial<CreateQuestionPayload>,
): Promise<QuizQuestion> {
	const { data } = await api.patch(`/question/${questionId}`, payload);
	return quizQuestionSchema.parse(data);
}

export async function deleteQuestion(questionId: string): Promise<void> {
	await api.delete(`/question/${questionId}`);
}
