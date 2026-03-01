'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	type CreateQuestionPayload,
	createLessonQuiz,
	createQuestion,
	deleteLessonQuiz,
	deleteQuestion,
	getLessonQuiz,
	updateQuestion,
} from '@/services/quiz';

const key = (lessonId: string) => ['quiz', lessonId];

export function useQuiz(lessonId: string) {
	return useQuery({
		queryKey: key(lessonId),
		queryFn: () => getLessonQuiz(lessonId),
		enabled: !!lessonId,
	});
}

export function useCreateQuiz(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (title: string) => createLessonQuiz(lessonId, title),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}

export function useDeleteQuiz(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (quizId: string) => deleteLessonQuiz(quizId),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}

export function useCreateQuestion(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			quizId,
			payload,
		}: {
			quizId: string;
			payload: CreateQuestionPayload;
		}) => createQuestion(quizId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}

export function useUpdateQuestion(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			questionId,
			payload,
		}: {
			questionId: string;
			payload: Partial<CreateQuestionPayload>;
		}) => updateQuestion(questionId, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}

export function useDeleteQuestion(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (questionId: string) => deleteQuestion(questionId),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}
