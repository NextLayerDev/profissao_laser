'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	CreateDefaultQuestionPayload,
	CreateDoubtCategoryPayload,
	UpdateDefaultQuestionPayload,
	UpdateDoubtCategoryPayload,
} from '@/services/doubt-chat';
import {
	createDefaultQuestion,
	createDoubtCategory,
	deleteDefaultQuestion,
	deleteDoubtCategory,
	getDefaultQuestions,
	getDoubtCategories,
	getDoubtChatsAdmin,
	getTechnicians,
	reorderDefaultQuestions,
	reorderDoubtCategories,
	sendDoubtChatMessage,
	updateDefaultQuestion,
	updateDoubtCategory,
} from '@/services/doubt-chat';

const QUERY_KEY = ['doubt-chat-admin'] as const;

export function useDoubtCategoriesAdmin(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'categories'] as const,
		queryFn: getDoubtCategories,
		enabled,
	});
}

export function useCreateDoubtCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateDoubtCategoryPayload) =>
			createDoubtCategory(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateDoubtCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateDoubtCategoryPayload;
		}) => updateDoubtCategory(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteDoubtCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteDoubtCategory(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useReorderDoubtCategories() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (categoryIds: string[]) => reorderDoubtCategories(categoryIds),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useTechniciansAdmin(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'technicians'] as const,
		queryFn: getTechnicians,
		enabled,
	});
}

export function useDefaultQuestions(
	technicianId: string | null,
	enabled = true,
) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'default-questions', technicianId] as const,
		queryFn: () => {
			if (!technicianId) throw new Error('Technician ID required');
			return getDefaultQuestions(technicianId);
		},
		enabled: !!technicianId && enabled,
	});
}

export function useCreateDefaultQuestion() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			technicianId,
			payload,
		}: {
			technicianId: string;
			payload: CreateDefaultQuestionPayload;
		}) => createDefaultQuestion(technicianId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateDefaultQuestion() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateDefaultQuestionPayload;
		}) => updateDefaultQuestion(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteDefaultQuestion() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteDefaultQuestion(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useReorderDefaultQuestions(technicianId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (questionIds: string[]) =>
			reorderDefaultQuestions(technicianId, questionIds),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDoubtChatsAdmin(categoryId?: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'chats', categoryId ?? 'all'] as const,
		queryFn: () => getDoubtChatsAdmin(categoryId ?? undefined),
		enabled,
	});
}

export function useReplyToDoubtChat() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ chatId, content }: { chatId: string; content: string }) =>
			sendDoubtChatMessage(chatId, content),
		onSuccess: (_data, variables) => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			qc.invalidateQueries({
				queryKey: ['doubt-chat', 'chat', variables.chatId],
			});
		},
	});
}
