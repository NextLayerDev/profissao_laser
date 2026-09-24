'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getActiveToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { useLiveChat, usePostLiveChat } from '../hooks';
import { LiveChatView } from './live-chat-view';

/**
 * Container do chat da live: mensagens persistidas via API; tempo real via
 * Supabase Realtime (postgres_changes em mnt_live_chat_messages, protegido por
 * RLS), com polling de 5s como fallback (hook useLiveChat).
 *
 * Continua uma ilha com busca própria em vez de receber os dados do container
 * da rota: subir o polling de 5s do chat para a página do detalhe faria a tela
 * inteira reavaliar a cada ciclo sem ganho nenhum.
 */
export function LiveChat({ liveId }: { liveId: string }) {
	const { data: messages = [] } = useLiveChat(liveId);
	const post = usePostLiveChat(liveId);
	const qc = useQueryClient();

	// Realtime como aprimoramento: invalida a query quando chega mensagem nova.
	useEffect(() => {
		const token = getActiveToken();
		if (token) db.realtime.setAuth(token);
		const channel = db
			.channel(`mnt-live-chat-${liveId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'mnt_live_chat_messages',
					filter: `live_room_id=eq.${liveId}`,
				},
				() => {
					qc.invalidateQueries({
						queryKey: ['mentoria', 'live-chat', liveId],
					});
				},
			)
			.subscribe();
		return () => {
			db.removeChannel(channel);
		};
	}, [liveId, qc]);

	return (
		<LiveChatView
			messages={messages}
			sending={post.isPending}
			onSend={(body) => post.mutate(body)}
		/>
	);
}
