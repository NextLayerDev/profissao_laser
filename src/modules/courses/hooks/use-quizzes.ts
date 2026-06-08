'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	attemptLessonQuiz,
	createLessonQuiz,
	createQuestion,
	deleteQuestion,
	deleteQuiz,
	getLessonQuiz,
	updateQuestion,
} from '../services/quizzes.service';
import type {
	CreateQuestionPayload,
	CreateQuizPayload,
	QuizAttemptAnswer,
	UpdateQuestionPayload,
} from '../types/quizzes';

export const lessonQuizQueryKey = (lessonId: string) =>
	['lessons', lessonId, 'quiz'] as const;

export function useLessonQuiz(lessonId: string, enabled = true) {
	return useQuery({
		queryKey: lessonQuizQueryKey(lessonId),
		queryFn: () => getLessonQuiz(lessonId),
		enabled: enabled && !!lessonId,
	});
}

function useInvalidateQuiz(lessonId: string) {
	const qc = useQueryClient();
	return () => qc.invalidateQueries({ queryKey: lessonQuizQueryKey(lessonId) });
}

export function useCreateLessonQuiz(lessonId: string) {
	const invalidate = useInvalidateQuiz(lessonId);
	return useMutation({
		mutationFn: (payload: CreateQuizPayload) =>
			createLessonQuiz(lessonId, payload),
		onSuccess: () => {
			invalidate();
			toast.success('Quiz criado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar quiz')),
	});
}

export function useDeleteQuiz(lessonId: string) {
	const invalidate = useInvalidateQuiz(lessonId);
	return useMutation({
		mutationFn: (quizId: string) => deleteQuiz(quizId),
		onSuccess: () => {
			invalidate();
			toast.success('Quiz removido!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover quiz')),
	});
}

export function useAttemptQuiz(lessonId: string) {
	return useMutation({
		mutationFn: (answers: QuizAttemptAnswer[]) =>
			attemptLessonQuiz(lessonId, answers),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao enviar respostas')),
	});
}

export function useCreateQuestion(lessonId: string) {
	const invalidate = useInvalidateQuiz(lessonId);
	return useMutation({
		mutationFn: ({
			quizId,
			payload,
		}: {
			quizId: string;
			payload: CreateQuestionPayload;
		}) => createQuestion(quizId, payload),
		onSuccess: () => invalidate(),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar questão')),
	});
}

export function useUpdateQuestion(lessonId: string) {
	const invalidate = useInvalidateQuiz(lessonId);
	return useMutation({
		mutationFn: ({
			questionId,
			payload,
		}: {
			questionId: string;
			payload: UpdateQuestionPayload;
		}) => updateQuestion(questionId, payload),
		onSuccess: () => invalidate(),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar questão')),
	});
}

export function useDeleteQuestion(lessonId: string) {
	const invalidate = useInvalidateQuiz(lessonId);
	return useMutation({
		mutationFn: (questionId: string) => deleteQuestion(questionId),
		onSuccess: () => invalidate(),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover questão')),
	});
}
