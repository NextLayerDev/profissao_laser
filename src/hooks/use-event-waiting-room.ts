'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import {
	getEventWaitingRoom,
	joinEventWaitingRoom,
	leaveEventWaitingRoom,
} from '@/services/community';

const waitingRoomKey = (eventId: string) =>
	['community', 'waiting-room', eventId] as const;

/**
 * Estado completo da sala de espera. Polling 5s para refletir mudanças no
 * status do evento (waiting room abrindo, live começando, encerrando) sem
 * depender 100% do realtime.
 */
export function useEventWaitingRoom(eventId: string | null) {
	return useQuery({
		queryKey: waitingRoomKey(eventId ?? ''),
		queryFn: () => getEventWaitingRoom(eventId as string),
		enabled: !!eventId,
		refetchInterval: 5_000,
		staleTime: 2_000,
	});
}

export function useJoinWaitingRoom(eventId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => joinEventWaitingRoom(eventId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: waitingRoomKey(eventId) });
		},
		onError: () => toast.error('Não foi possível entrar na sala'),
	});
}

export function useLeaveWaitingRoom(eventId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => leaveEventWaitingRoom(eventId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: waitingRoomKey(eventId) });
		},
		onError: () => toast.error('Erro ao sair da sala'),
	});
}

/**
 * Assina realtime no Supabase para inserts/updates/deletes em
 * pl_event_attendance filtrado por eventId. Quando algo muda,
 * invalida a query do waiting-room para refetch imediato — não fica
 * esperando o polling de 5s.
 */
export function useEventPresenceRealtime(eventId: string | null) {
	const qc = useQueryClient();

	useEffect(() => {
		if (!eventId) return;

		const channel = db
			.channel(`pl_event_attendance:${eventId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'pl_event_attendance',
					filter: `eventId=eq.${eventId}`,
				},
				() => {
					qc.invalidateQueries({ queryKey: waitingRoomKey(eventId) });
				},
			)
			.subscribe();

		return () => {
			db.removeChannel(channel);
		};
	}, [eventId, qc]);
}
