'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { userRealtimeDb } from '@/lib/db';
import { useLiveChat, usePostLiveChat } from '../hooks';
import { LiveChatView } from './live-chat-view';

/**
 * Container do chat da live: mensagens persistidas via API; tempo real via
 * Supabase Realtime (postgres_changes em mnt_live_chat_messages, protegido por
 * RLS, com o JWT do aluno — ver `userRealtimeDb`). O polling de 5s só liga
 * quando a inscrição não está ativa (falhou, caiu ou ainda conectando) — antes
 * rodava junto com o Realtime o tempo todo.
 *
 * Continua uma ilha com busca própria em vez de receber os dados do container
 * da rota: o chat atualizar não deve reavaliar a tela inteira.
 */
export function LiveChat({ liveId }: { liveId: string }) {
	const [realtime, setRealtime] = useState(false);
	const { data: messages = [] } = useLiveChat(liveId, { poll: !realtime });
	const post = usePostLiveChat(liveId);
	const qc = useQueryClient();

	// Chegou mensagem nova (ou a inscrição acabou de subir e pode ter perdido
	// alguma no meio): recarrega a lista.
	useEffect(() => {
		const refresh = () =>
			qc.invalidateQueries({ queryKey: ['mentoria', 'live-chat', liveId] });
		// Sem config do Supabase (ou erro ao abrir o canal) o chat não pode
		// quebrar a página: fica no polling.
		let cancelled = false;
		let rt: ReturnType<typeof userRealtimeDb> | null = null;
		let channel: ReturnType<
			ReturnType<typeof userRealtimeDb>['channel']
		> | null = null;
		(async () => {
			try {
				rt = userRealtimeDb();
				// O JWT tem de estar no socket ANTES do join: o supabase-js busca o
				// token do callback em paralelo e, se o join sai antes, o canal
				// entra como anon e nunca é atualizado (a RLS barra os eventos).
				await rt.realtime.setAuth();
				if (cancelled) return;
				channel = rt
					.channel(`mnt-live-chat-${liveId}`)
					.on(
						'postgres_changes',
						{
							event: 'INSERT',
							schema: 'public',
							table: 'mnt_live_chat_messages',
							filter: `live_room_id=eq.${liveId}`,
						},
						refresh,
					)
					.subscribe((status) => {
						const on = status === 'SUBSCRIBED';
						setRealtime(on);
						if (on) refresh();
					});
			} catch {
				setRealtime(false);
			}
		})();
		return () => {
			cancelled = true;
			setRealtime(false);
			if (rt && channel) rt.removeChannel(channel);
		};
	}, [liveId, qc]);

	return (
		<LiveChatView
			messages={messages}
			sending={post.isPending}
			// Sem onError a mensagem sumia do campo e não chegava ao chat, calada.
			onSend={(body, cb) =>
				post.mutate(body, {
					onError: (e) => {
						toast.error(
							(e as { response?: { status?: number } })?.response?.status ===
								429
								? 'Você está enviando rápido demais. Aguarde alguns segundos.'
								: 'Mensagem não enviada. Tente de novo.',
						);
						cb?.onError?.();
					},
				})
			}
		/>
	);
}
