'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getActiveToken } from '@/lib/auth';
import { api } from '@/lib/fetch';
import {
	connectOmniInstance,
	createOmniAgent,
	createOmniInstance,
	deleteOmniAgent,
	deleteOmniInstance,
	deleteOmniKbFile,
	getOmniAgents,
	getOmniBusinessConfig,
	getOmniChats,
	getOmniInstanceStats,
	getOmniInstanceStatus,
	getOmniInstances,
	getOmniKbFiles,
	getOmniMessages,
	markOmniChatRead,
	putOmniBusinessConfig,
	searchOmniKb,
	sendOmniFile,
	sendOmniText,
	transferAllOmniChatsToAi,
	transferOmniChat,
	updateOmniAgent,
	updateOmniChat,
	updateOmniInstance,
	uploadOmniKbFile,
} from '../services/omni.service';
import type { OmniChat, OmniChatListParams, OmniMessage } from '../types/omni';

const KEY = ['omni'] as const;

/* ─────────────────────────── Socket (realtime) ─────────────────────────── */

/**
 * Socket próprio do OmniResposta (main API, path /omni/socket). Aplica os
 * eventos direto no cache do React Query; expõe `connected` — os hooks de
 * dados usam polling de 5s como FALLBACK quando desconectado.
 */
export function useOmniSocket(instanceId: string | null) {
	const qc = useQueryClient();
	const [connected, setConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		if (!instanceId) return;
		const token = getActiveToken();
		if (!token) return;
		let origin = '';
		try {
			origin = new URL(api.defaults.baseURL ?? '').origin;
		} catch {
			return;
		}
		const socket = io(origin, {
			path: '/omni/socket',
			auth: { token },
			reconnectionDelayMax: 10_000,
		});
		socketRef.current = socket;
		socket.on('connect', () => {
			setConnected(true);
			socket.emit('join-instance', { instanceId });
		});
		socket.on('disconnect', () => setConnected(false));

		socket.on('new-message', (p: { chatId: string; message: OmniMessage }) => {
			qc.setQueryData<OmniMessage[]>([...KEY, 'messages', p.chatId], (prev) => {
				if (!prev) return prev;
				if (prev.some((m) => m.id === p.message.id)) return prev;
				return [...prev, p.message];
			});
			qc.invalidateQueries({ queryKey: [...KEY, 'chats', instanceId] });
		});
		socket.on('chat-update', (p: { chat?: OmniChat }) => {
			qc.invalidateQueries({ queryKey: [...KEY, 'chats', instanceId] });
			if (p.chat) {
				qc.setQueryData<OmniChat | undefined>(
					[...KEY, 'chat', p.chat.id],
					p.chat,
				);
			}
		});
		socket.on('messages-read', (p: { chatId: string }) => {
			qc.invalidateQueries({ queryKey: [...KEY, 'messages', p.chatId] });
		});
		socket.on('instance-status', () => {
			qc.invalidateQueries({ queryKey: [...KEY, 'instances'] });
		});
		socket.on('billing-status', () => {
			qc.invalidateQueries({ queryKey: [...KEY, 'instances'] });
		});

		return () => {
			socket.emit('leave-instance', { instanceId });
			socket.disconnect();
			socketRef.current = null;
			setConnected(false);
		};
	}, [instanceId, qc]);

	return { connected };
}

/* ─────────────────────────── Instância ─────────────────────────── */

export function useOmniInstances() {
	return useQuery({
		queryKey: [...KEY, 'instances'],
		queryFn: getOmniInstances,
		staleTime: 30_000,
	});
}

/** Instância "ativa" (v1: a primeira). */
export function useActiveOmniInstance() {
	const q = useOmniInstances();
	const instance = useMemo(
		() => (q.data && q.data.length > 0 ? q.data[0] : null),
		[q.data],
	);
	return { ...q, instance };
}

export function useOmniInstanceMutations() {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...KEY, 'instances'] });
	const create = useMutation({
		mutationFn: createOmniInstance,
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: (args: {
			id: string;
			patch: Parameters<typeof updateOmniInstance>[1];
		}) => updateOmniInstance(args.id, args.patch),
		onSuccess: invalidate,
	});
	const remove = useMutation({
		mutationFn: deleteOmniInstance,
		onSuccess: invalidate,
	});
	const connect = useMutation({
		mutationFn: connectOmniInstance,
		onSuccess: invalidate,
	});
	return { create, update, remove, connect };
}

/** Poll de status durante o wizard (QR → conectado). */
export function useOmniInstanceStatus(
	instanceId: string | null,
	enabled: boolean,
) {
	return useQuery({
		queryKey: [...KEY, 'status', instanceId],
		queryFn: () => getOmniInstanceStatus(instanceId ?? ''),
		enabled: !!instanceId && enabled,
		refetchInterval: 3000,
	});
}

export function useOmniStats(instanceId: string | null) {
	return useQuery({
		queryKey: [...KEY, 'stats', instanceId],
		queryFn: () => getOmniInstanceStats(instanceId ?? ''),
		enabled: !!instanceId,
		refetchInterval: 30_000,
	});
}

/* ─────────────────────────── Chats / Mensagens ─────────────────────────── */

export function useOmniChats(
	instanceId: string | null,
	params: OmniChatListParams,
	socketConnected: boolean,
) {
	return useQuery({
		queryKey: [...KEY, 'chats', instanceId, params],
		queryFn: async () => {
			const res = await getOmniChats(instanceId ?? '', params);
			return Array.isArray(res) ? res : (res.chats ?? []);
		},
		enabled: !!instanceId,
		refetchInterval: socketConnected ? false : 5000,
	});
}

export function useOmniMessages(
	chatId: string | null,
	socketConnected: boolean,
) {
	return useQuery({
		queryKey: [...KEY, 'messages', chatId],
		queryFn: () => getOmniMessages(chatId ?? '', {}),
		enabled: !!chatId,
		refetchInterval: socketConnected ? false : 4000,
	});
}

export function useOmniChatMutations(instanceId: string | null) {
	const qc = useQueryClient();
	const invalidateChats = () =>
		qc.invalidateQueries({ queryKey: [...KEY, 'chats', instanceId] });
	const sendText = useMutation({
		mutationFn: (args: { chatId: string; text: string }) =>
			sendOmniText(args.chatId, args.text),
		onSuccess: (msg, args) => {
			qc.setQueryData<OmniMessage[]>(
				[...KEY, 'messages', args.chatId],
				(prev) => (prev ? [...prev, msg] : prev),
			);
			invalidateChats();
		},
	});
	const sendFile = useMutation({
		mutationFn: (args: { chatId: string; file: File; caption?: string }) =>
			sendOmniFile(args.chatId, args.file, args.caption),
		onSuccess: (msg, args) => {
			qc.setQueryData<OmniMessage[]>(
				[...KEY, 'messages', args.chatId],
				(prev) => (prev ? [...prev, msg] : prev),
			);
			invalidateChats();
		},
	});
	const patchChat = useMutation({
		mutationFn: (args: {
			chatId: string;
			patch: Parameters<typeof updateOmniChat>[1];
		}) => updateOmniChat(args.chatId, args.patch),
		onSuccess: invalidateChats,
	});
	const markRead = useMutation({
		mutationFn: (chatId: string) => markOmniChatRead(chatId),
		onSuccess: invalidateChats,
	});
	const transfer = useMutation({
		mutationFn: (args: {
			chatId: string;
			to: 'ai' | 'user';
			userId?: string;
			userName?: string;
		}) =>
			transferOmniChat(
				args.chatId,
				args.to === 'ai'
					? { to: 'ai' }
					: {
							to: 'user',
							userId: args.userId ?? '',
							userName: args.userName ?? '',
						},
			),
		onSuccess: invalidateChats,
	});
	const transferAll = useMutation({
		mutationFn: () => transferAllOmniChatsToAi(instanceId ?? ''),
		onSuccess: invalidateChats,
	});
	return { sendText, sendFile, patchChat, markRead, transfer, transferAll };
}

/* ─────────────────────────── Agentes / Config / KB ─────────────────────────── */

export function useOmniAgents(instanceId: string | null) {
	return useQuery({
		queryKey: [...KEY, 'agents', instanceId],
		queryFn: () => getOmniAgents(instanceId ?? ''),
		enabled: !!instanceId,
	});
}

export function useOmniAgentMutations(instanceId: string | null) {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...KEY, 'agents', instanceId] });
	const create = useMutation({
		mutationFn: (payload: Parameters<typeof createOmniAgent>[1]) =>
			createOmniAgent(instanceId ?? '', payload),
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: (args: {
			agentId: string;
			patch: Parameters<typeof updateOmniAgent>[1];
		}) => updateOmniAgent(args.agentId, args.patch),
		onSuccess: invalidate,
	});
	const remove = useMutation({
		mutationFn: deleteOmniAgent,
		onSuccess: invalidate,
	});
	return { create, update, remove };
}

export function useOmniConfig(instanceId: string | null) {
	const qc = useQueryClient();
	const query = useQuery({
		queryKey: [...KEY, 'config', instanceId],
		queryFn: () => getOmniBusinessConfig(instanceId ?? ''),
		enabled: !!instanceId,
	});
	const save = useMutation({
		mutationFn: (config: Parameters<typeof putOmniBusinessConfig>[1]) =>
			putOmniBusinessConfig(instanceId ?? '', config),
		onSuccess: (data) => qc.setQueryData([...KEY, 'config', instanceId], data),
	});
	return { ...query, save };
}

export function useOmniKb(instanceId: string | null) {
	const qc = useQueryClient();
	const files = useQuery({
		queryKey: [...KEY, 'kb', instanceId],
		queryFn: () => getOmniKbFiles(instanceId ?? ''),
		enabled: !!instanceId,
		refetchInterval: (query) =>
			query.state.data?.some((f) => f.status === 'processing') ? 4000 : false,
	});
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...KEY, 'kb', instanceId] });
	const upload = useMutation({
		mutationFn: (file: File) => uploadOmniKbFile(instanceId ?? '', file),
		onSuccess: invalidate,
	});
	const remove = useMutation({
		mutationFn: deleteOmniKbFile,
		onSuccess: invalidate,
	});
	const search = useMutation({
		mutationFn: (query: string) => searchOmniKb(instanceId ?? '', query),
	});
	return { files, upload, remove, search };
}
