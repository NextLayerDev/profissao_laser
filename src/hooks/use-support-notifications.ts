'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { listAdminSupportChats } from '@/services/support-chat';
import type { SupportChatSummary } from '@/types/support-chat';

// Não-lido sem read-receipts no servidor: comparamos lastMessageAt (denormalizado
// pela API) com o último "visto" guardado em localStorage — por navegador.
const ADMIN_SEEN_KEY = 'pl-support-admin-seen';
const SOUND_KEY = 'pl-support-sound';
/** Timestamp da mensagem mais nova já anunciada com toast/som (por navegador). */
const NOTIFIED_KEY = 'pl-support-admin-notified';

type SeenMap = Record<string, string>;

function readSeenMap(): SeenMap {
	if (typeof window === 'undefined') return {};
	try {
		return JSON.parse(localStorage.getItem(ADMIN_SEEN_KEY) ?? '{}') as SeenMap;
	} catch {
		return {};
	}
}

function writeSeenMap(map: SeenMap) {
	localStorage.setItem(ADMIN_SEEN_KEY, JSON.stringify(map));
}

export function isSupportSoundEnabled() {
	if (typeof window === 'undefined') return true;
	return localStorage.getItem(SOUND_KEY) !== 'off';
}

export function setSupportSoundEnabled(enabled: boolean) {
	localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
}

/** Beep curto via Web Audio (sem asset binário). */
function playBeep() {
	try {
		const Ctx =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext: typeof AudioContext })
				.webkitAudioContext;
		const ctx = new Ctx();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = 880;
		gain.gain.setValueAtTime(0.12, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.4);
		osc.onended = () => ctx.close();
	} catch {
		// áudio bloqueado pelo browser — silencioso
	}
}

function isUnread(chat: SupportChatSummary, seen: SeenMap) {
	if (chat.lastMessageRole !== 'customer' || !chat.lastMessageAt) return false;
	if (chat.status === 'closed') return false;
	const seenAt = seen[chat.id];
	return !seenAt || chat.lastMessageAt > seenAt;
}

/**
 * Notificações de suporte para o ADM: badge (contagem), toast + som ao chegar
 * mensagem nova de cliente, e contador no título da aba.
 */
export function useAdminSupportNotifications(enabled = true) {
	const { data: chats } = useQuery({
		queryKey: ['support-chat-admin', 'notifications'],
		queryFn: () => listAdminSupportChats(),
		enabled,
		refetchInterval: enabled ? 10000 : false,
	});

	const [seenVersion, setSeenVersion] = useState(0);
	const seen = useMemo(() => {
		void seenVersion;
		return readSeenMap();
	}, [seenVersion]);

	const unreadIds = useMemo(() => {
		const ids = new Set<string>();
		for (const chat of chats ?? []) {
			if (isUnread(chat, seen)) ids.add(chat.id);
		}
		return ids;
	}, [chats, seen]);

	/** Chats não lidos, mais recentes primeiro (p/ o sino do header). */
	const unreadChats = useMemo(
		() =>
			(chats ?? [])
				.filter((c) => unreadIds.has(c.id))
				.sort((a, b) =>
					(b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''),
				),
		[chats, unreadIds],
	);

	const unreadCount = unreadIds.size;

	const markSeen = useCallback((chatId: string, at?: string | null) => {
		const map = readSeenMap();
		map[chatId] = at ?? new Date().toISOString();
		writeSeenMap(map);
		setSeenVersion((v) => v + 1);
	}, []);

	// Toast + beep SÓ quando chega mensagem mais nova do que a última já
	// notificada (baseline persistido) — abrir aba/página ou logar de novo
	// não re-notifica: o pendente fica só no badge do sino.
	useEffect(() => {
		if (!chats || chats.length === 0) return;
		const maxUnreadAt = unreadChats[0]?.lastMessageAt;
		if (!maxUnreadAt) return;

		const notifiedUpTo = localStorage.getItem(NOTIFIED_KEY);
		if (!notifiedUpTo) {
			// Primeira vez neste navegador: não notifica o histórico.
			localStorage.setItem(NOTIFIED_KEY, maxUnreadAt);
			return;
		}
		if (maxUnreadAt > notifiedUpTo) {
			localStorage.setItem(NOTIFIED_KEY, maxUnreadAt);
			toast.info(
				unreadChats.length === 1
					? 'Nova mensagem no chat de atendimento'
					: `${unreadChats.length} chats com mensagens novas`,
			);
			if (isSupportSoundEnabled()) playBeep();
		}
	}, [chats, unreadChats]);

	// Contador no título da aba.
	useEffect(() => {
		const base = document.title.replace(/^\(\d+\)\s*/, '');
		document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
		return () => {
			document.title = document.title.replace(/^\(\d+\)\s*/, '');
		};
	}, [unreadCount]);

	return { unreadCount, unreadIds, unreadChats, markSeen };
}
