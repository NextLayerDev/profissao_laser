import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	adminCloseSupportChat,
	adminSendSupportMessage,
	getAdminSupportChat,
	listAdminSupportChats,
	takeOverSupportChat,
} from '@/services/support-chat';
import type { SupportChat, SupportChatStatus } from '@/types/support-chat';

const KEY = ['support-chat-admin'];

export function useAdminSupportChats(status?: SupportChatStatus) {
	return useQuery({
		queryKey: [...KEY, 'list', status ?? 'all'],
		queryFn: () => listAdminSupportChats(status),
		refetchInterval: 8000,
	});
}

export function useAdminSupportChat(id: string | null) {
	return useQuery({
		queryKey: [...KEY, 'chat', id],
		queryFn: () => getAdminSupportChat(id ?? ''),
		enabled: !!id,
		refetchInterval: (query) =>
			query.state.data?.status === 'closed' ? false : 4000,
	});
}

export function useAdminSendMessage(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (content: string) => adminSendSupportMessage(id ?? '', content),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
			qc.invalidateQueries({ queryKey: [...KEY, 'list'] });
		},
	});
}

export function useTakeOverSupportChat(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => takeOverSupportChat(id ?? ''),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
			qc.invalidateQueries({ queryKey: [...KEY, 'list'] });
		},
	});
}

export function useAdminCloseSupportChat(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => adminCloseSupportChat(id ?? ''),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
			qc.invalidateQueries({ queryKey: [...KEY, 'list'] });
		},
	});
}
