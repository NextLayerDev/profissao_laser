'use client';

import { useQuery } from '@tanstack/react-query';
import { getDoubtChatsAdmin } from '@/services/doubt-chat';
import { getAdminLessonDoubts } from '@/services/doubts';
import { getForumPosts } from '@/services/forum';
import { useAdminSupportNotifications } from './use-support-notifications';

/**
 * Central de pendências do staff: agrega tudo que precisa de atenção —
 * mensagens novas e chats aguardando no atendimento ao vivo, chamados
 * pendentes, dúvidas de aula sem resposta e threads do fórum sem resposta.
 * Alimenta o sino do header, os badges da sidebar e as abas de Suporte.
 */
export function useAdminPendings(enabled = true) {
	// Chat ao vivo: mensagens não lidas + aguardando humano (poll 10s já existente).
	const { unreadCount, unreadChats, waitingChats, markSeen } =
		useAdminSupportNotifications(enabled);

	// Chamados (tickets) pendentes de resposta.
	const { data: ticketsPending = 0 } = useQuery({
		queryKey: ['admin-pendings', 'tickets'],
		queryFn: async () => {
			const chats = await getDoubtChatsAdmin();
			return chats.filter((c) => c.status === 'pending').length;
		},
		enabled,
		refetchInterval: 60_000,
	});

	// Dúvidas de aula sem resposta (endpoint agregado — 1 chamada leve).
	const { data: lessonDoubtsPending = 0 } = useQuery({
		queryKey: ['admin-pendings', 'lesson-doubts'],
		queryFn: async () => {
			const res = await getAdminLessonDoubts({
				status: 'unanswered',
				limit: 1,
			});
			return res.unansweredCount;
		},
		enabled,
		refetchInterval: 60_000,
	});

	// Fórum: threads sem nenhuma resposta (a API calcula o total filtrado).
	const { data: forumUnanswered = 0 } = useQuery({
		queryKey: ['admin-pendings', 'forum-unanswered'],
		queryFn: async () => {
			const res = await getForumPosts({ sort: 'unanswered', limit: 1 });
			return res.total;
		},
		enabled,
		refetchInterval: 120_000,
	});

	const liveWaiting = waitingChats.length;
	/** Total da área de Suporte (badge da sidebar). */
	const supportTotal =
		unreadCount + liveWaiting + ticketsPending + lessonDoubtsPending;
	/** Total geral (badge do sino). */
	const grandTotal = supportTotal + forumUnanswered;

	return {
		// chat ao vivo
		unreadCount,
		unreadChats,
		waitingChats,
		liveWaiting,
		markSeen,
		// chamados
		ticketsPending,
		// dúvidas de aula
		lessonDoubtsPending,
		// fórum
		forumUnanswered,
		// agregados
		supportTotal,
		grandTotal,
	};
}
