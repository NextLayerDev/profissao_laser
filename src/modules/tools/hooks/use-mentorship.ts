'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	addMaterial,
	type CreateSessionBody,
	createMentorshipSession,
	deleteMaterial,
	deleteMentorshipSession,
	getRoomState,
	joinSession,
	leaveSession,
	listMaterials,
	listMentorshipSessions,
	listMessages,
	postMessage,
	type UpdateSessionBody,
	updateMentorshipSession,
} from '../services/mentorship.service';

const SESSIONS_KEY = (toolKey: string) =>
	['mentorship', 'sessions', toolKey] as const;
const ROOM_KEY = (sessionId: string) =>
	['mentorship', 'room', sessionId] as const;

/** Lista de sessões de uma Mentoria. */
export function useMentorshipSessions(toolKey: string) {
	return useQuery({
		queryKey: SESSIONS_KEY(toolKey),
		queryFn: () => listMentorshipSessions(toolKey),
		enabled: !!toolKey,
		staleTime: 30_000,
	});
}

/**
 * Estado da sala de uma sessão. Polling 5s (timing/presença) — só quando há
 * uma sessão aberta na tela. O realtime (abaixo) acelera os updates de presença.
 */
export function useRoomState(sessionId: string | null) {
	return useQuery({
		queryKey: ROOM_KEY(sessionId ?? ''),
		queryFn: () => getRoomState(sessionId as string),
		enabled: !!sessionId,
		refetchInterval: 5_000,
		staleTime: 2_000,
	});
}

/** Realtime de presença (pl_mentorship_attendance) → invalida a sala na hora. */
export function useRoomPresenceRealtime(sessionId: string | null) {
	const qc = useQueryClient();
	useEffect(() => {
		if (!sessionId) return;
		const channel = db
			.channel(`pl_mentorship_attendance:${sessionId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'pl_mentorship_attendance',
					filter: `sessionId=eq.${sessionId}`,
				},
				() => qc.invalidateQueries({ queryKey: ROOM_KEY(sessionId) }),
			)
			.subscribe();
		return () => {
			db.removeChannel(channel);
		};
	}, [sessionId, qc]);
}

/** Sai da sala (marca leftAt). */
export function useLeaveRoom(sessionId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => leaveSession(sessionId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ROOM_KEY(sessionId) }),
		onError: () => toast.error('Erro ao sair da sala'),
	});
}

/** Entrada grátis (plano incluído / staff). Para entrada paga use useRunTool. */
export function useJoinRoomFree(sessionId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => joinSession(sessionId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ROOM_KEY(sessionId) }),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Não foi possível entrar na sala')),
	});
}

/* ── Admin ── */
export function useCreateSession(toolKey: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: CreateSessionBody) =>
			createMentorshipSession(toolKey, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: SESSIONS_KEY(toolKey) });
			toast.success('Sessão criada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar a sessão')),
	});
}

export function useUpdateSession(toolKey: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: UpdateSessionBody }) =>
			updateMentorshipSession(id, body),
		onSuccess: (s) => {
			qc.invalidateQueries({ queryKey: SESSIONS_KEY(toolKey) });
			qc.invalidateQueries({ queryKey: ROOM_KEY(s.id) });
			toast.success('Sessão atualizada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar a sessão')),
	});
}

export function useDeleteSession(toolKey: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteMentorshipSession(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: SESSIONS_KEY(toolKey) });
			toast.success('Sessão removida.');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover a sessão')),
	});
}

/* ── Materiais (M4) ── */
const MATERIALS_KEY = (sessionId: string) =>
	['mentorship', 'materials', sessionId] as const;

export function useMaterials(sessionId: string | null, enabled = true) {
	return useQuery({
		queryKey: MATERIALS_KEY(sessionId ?? ''),
		queryFn: () => listMaterials(sessionId as string),
		enabled: !!sessionId && enabled,
		staleTime: 30_000,
	});
}

export function useAddMaterial(sessionId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: { title: string; url: string }) =>
			addMaterial(sessionId, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: MATERIALS_KEY(sessionId) });
			toast.success('Material adicionado.');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao adicionar material')),
	});
}

export function useDeleteMaterial(sessionId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (materialId: string) => deleteMaterial(materialId),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: MATERIALS_KEY(sessionId) }),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover material')),
	});
}

/* ── Chat (M4) ── */
const MESSAGES_KEY = (sessionId: string) =>
	['mentorship', 'messages', sessionId] as const;

export function useMessages(sessionId: string | null, enabled = true) {
	return useQuery({
		queryKey: MESSAGES_KEY(sessionId ?? ''),
		queryFn: () => listMessages(sessionId as string),
		enabled: !!sessionId && enabled,
		refetchInterval: 8_000,
		staleTime: 2_000,
	});
}

/** Realtime de chat (INSERT em pl_mentorship_message) → invalida na hora. */
export function useMessagesRealtime(sessionId: string | null, enabled = true) {
	const qc = useQueryClient();
	useEffect(() => {
		if (!sessionId || !enabled) return;
		const channel = db
			.channel(`pl_mentorship_message:${sessionId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'pl_mentorship_message',
					filter: `sessionId=eq.${sessionId}`,
				},
				() => qc.invalidateQueries({ queryKey: MESSAGES_KEY(sessionId) }),
			)
			.subscribe();
		return () => {
			db.removeChannel(channel);
		};
	}, [sessionId, enabled, qc]);
}

export function usePostMessage(sessionId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (content: string) => postMessage(sessionId, content),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: MESSAGES_KEY(sessionId) }),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao enviar mensagem')),
	});
}
