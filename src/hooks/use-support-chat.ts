import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	closeSupportChat,
	createSupportChat,
	getSupportChat,
	requestHuman,
	sendSupportMessage,
} from '@/services/support-chat';
import type { SupportChat } from '@/types/support-chat';

const KEY = ['support-chat'];

export function useSupportChat(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...KEY, 'chat', id],
		queryFn: () => getSupportChat(id ?? ''),
		enabled: !!id && enabled,
		refetchInterval: (query) =>
			query.state.data?.status === 'closed' ? false : 4000,
	});
}

export function useCreateSupportChat() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (message?: string) => createSupportChat(message),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
		},
	});
}

export function useSendSupportMessage(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (content: string) => sendSupportMessage(id ?? '', content),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
		},
	});
}

export function useRequestHuman(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => requestHuman(id ?? ''),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
		},
	});
}

export function useCloseSupportChat(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => closeSupportChat(id ?? ''),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
		},
	});
}
