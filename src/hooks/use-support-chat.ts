import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
	closeSupportChat,
	createSupportChat,
	getSupportChat,
	listSupportChats,
	requestHuman,
	sendSupportMessage,
} from '@/services/support-chat';
import type {
	SupportChat,
	SupportChatCreateResult,
	SupportChatSummary,
} from '@/types/support-chat';

const KEY = ['support-chat'];
const LIST_KEY = [...KEY, 'list'];

/** Um atendimento é "aberto" enquanto não for encerrado pelo staff/aluno. */
export function isSupportChatOpen(chat: SupportChatSummary) {
	return chat.status !== 'closed';
}

/**
 * Lista de atendimentos do aluno — FONTE DE VERDADE de qual atendimento está
 * aberto. Antes o id do chat vivia em useState e sumia num F5, o que fazia o
 * aluno abrir vários atendimentos pro mesmo assunto. Como o backend garante no
 * máximo 1 chat não-encerrado por cliente, basta perguntar pro servidor.
 */
export function useSupportChats(enabled = true) {
	const query = useQuery({
		queryKey: LIST_KEY,
		queryFn: listSupportChats,
		enabled,
		// Refetch periódico (e ao focar a aba) pra perceber quando o staff
		// encerra o atendimento em outra ponta.
		refetchInterval: 30_000,
	});

	const chats = query.data ?? [];
	// Só pode existir um aberto; a lista já vem ordenada por updatedAt desc.
	const activeChat = chats.find(isSupportChatOpen) ?? null;
	const closedChats = chats.filter((c) => !isSupportChatOpen(c));

	return {
		chats,
		activeChat,
		closedChats,
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		refetch: query.refetch,
	};
}

export function useSupportChat(id: string | null, enabled = true) {
	const qc = useQueryClient();
	const query = useQuery({
		queryKey: [...KEY, 'chat', id],
		queryFn: () => getSupportChat(id ?? ''),
		enabled: !!id && enabled,
		refetchInterval: (q) => (q.state.data?.status === 'closed' ? false : 4000),
	});

	// Quando o staff encerra, a lista precisa ser revalidada na hora — senão o
	// front continuaria achando que existe um atendimento em andamento e o
	// botão de "novo atendimento" ficaria travado.
	const status = query.data?.status;
	useEffect(() => {
		if (status === 'closed') {
			qc.invalidateQueries({ queryKey: LIST_KEY });
		}
	}, [status, qc]);

	return query;
}

export function useCreateSupportChat() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (message?: string) => createSupportChat(message),
		onSuccess: (chat: SupportChatCreateResult) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
			// O chat pode ter sido criado OU reaproveitado: nos dois casos a lista
			// muda (novo item ou updatedAt novo).
			qc.invalidateQueries({ queryKey: LIST_KEY });
		},
	});
}

export function useSendSupportMessage(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (content: string) => sendSupportMessage(id ?? '', content),
		// Mostra a mensagem do cliente na hora (sem esperar a resposta da IA).
		onMutate: async (content: string) => {
			const key = [...KEY, 'chat', id];
			await qc.cancelQueries({ queryKey: key });
			const prev = qc.getQueryData<SupportChat>(key);
			if (prev) {
				qc.setQueryData<SupportChat>(key, {
					...prev,
					messages: [
						...prev.messages,
						{
							id: `tmp-${Date.now()}`,
							chatId: prev.id,
							role: 'customer',
							authorId: prev.customerId,
							authorName: prev.customerName ?? 'Você',
							content,
							createdAt: new Date().toISOString(),
						},
					],
				});
			}
			return { key, prev };
		},
		onError: (_err, _content, ctx) => {
			if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
		},
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
			qc.invalidateQueries({ queryKey: LIST_KEY });
		},
	});
}

export function useRequestHuman(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => requestHuman(id ?? ''),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
			qc.invalidateQueries({ queryKey: LIST_KEY });
		},
	});
}

export function useCloseSupportChat(id: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => closeSupportChat(id ?? ''),
		onSuccess: (chat: SupportChat) => {
			qc.setQueryData([...KEY, 'chat', chat.id], chat);
			qc.invalidateQueries({ queryKey: LIST_KEY });
		},
	});
}
