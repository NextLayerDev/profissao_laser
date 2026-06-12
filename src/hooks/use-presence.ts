'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
	getPayingMembersCount,
	getPresenceSummary,
	sendPresenceHeartbeat,
} from '@/services/presence';

const HEARTBEAT_MS = 60_000;

/**
 * Ping de presença enquanto o app está aberto (pausa com a aba oculta).
 * Montar uma vez no shell do curso.
 */
export function usePresenceHeartbeat(enabled = true) {
	useEffect(() => {
		if (!enabled) return;

		const beat = () => {
			if (document.hidden) return;
			sendPresenceHeartbeat().catch(() => {
				// sem rede/sem auth — silencioso, tenta no próximo tick
			});
		};

		beat();
		const id = window.setInterval(beat, HEARTBEAT_MS);
		const onVisible = () => {
			if (!document.hidden) beat();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			window.clearInterval(id);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, [enabled]);
}

/** Totais de presença (staff): membros cadastrados + online agora. */
export function usePresenceSummary() {
	return useQuery({
		queryKey: ['presence-summary'],
		queryFn: getPresenceSummary,
		refetchInterval: 60_000,
	});
}

/** Assinantes pagantes (active+trialing) — analytics upvox (staff). */
export function usePayingMembersCount() {
	return useQuery({
		queryKey: ['paying-members-count'],
		queryFn: getPayingMembersCount,
		staleTime: 5 * 60_000,
	});
}
