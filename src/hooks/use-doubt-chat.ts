'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	CreateDoubtChatPayload,
	DoubtChatStatus,
} from '@/services/doubt-chat';
import {
	assignRandomTechnician,
	createDoubtChat,
	getDoubtCategories,
	getDoubtChat,
	getDoubtChats,
	getTechnician,
	getTechnicians,
	sendDoubtChatMessage,
} from '@/services/doubt-chat';

const QUERY_KEY = ['doubt-chat'] as const;

export function useDoubtCategories(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'categories'] as const,
		queryFn: getDoubtCategories,
		enabled,
	});
}

export function useTechnicians(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'technicians'] as const,
		queryFn: getTechnicians,
		enabled,
	});
}

export function useTechnician(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'technician', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getTechnician(id);
		},
		enabled: !!id && enabled,
	});
}

export function useDoubtChats(status: DoubtChatStatus = 'all', enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'chats', status] as const,
		queryFn: () => getDoubtChats(status),
		enabled,
	});
}

export function useDoubtChat(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'chat', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getDoubtChat(id);
		},
		enabled: !!id && enabled,
	});
}

export function useCreateDoubtChat() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateDoubtChatPayload) => createDoubtChat(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useSendDoubtMessage(chatId: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ content, file }: { content: string; file?: File }) => {
			if (!chatId) throw new Error('Chat ID required');
			return sendDoubtChatMessage(chatId, content, file);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useAssignRandomTechnician(chatId: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => {
			if (!chatId) throw new Error('Chat ID required');
			return assignRandomTechnician(chatId);
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
