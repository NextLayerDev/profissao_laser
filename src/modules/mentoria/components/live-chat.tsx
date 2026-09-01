'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getActiveToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { useLiveChat, usePostLiveChat } from '../hooks';

/**
 * Chat da live: mensagens persistidas via API; tempo real via Supabase
 * Realtime (postgres_changes em mnt_live_chat_messages, protegido por RLS),
 * com polling de 5s como fallback (hook useLiveChat).
 */
export function LiveChat({ liveId }: { liveId: string }) {
	const { data: messages = [] } = useLiveChat(liveId);
	const post = usePostLiveChat(liveId);
	const qc = useQueryClient();
	const [text, setText] = useState('');
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

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

	const send = () => {
		const body = text.trim();
		if (!body || post.isPending) return;
		setText('');
		post.mutate(body);
	};

	return (
		<div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
			<div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-900 dark:text-slate-100">
				Chat da live
			</div>
			<div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
				{messages.length === 0 && (
					<p className="text-sm text-slate-400 dark:text-gray-500 text-center py-6">
						Seja o primeiro a mandar uma mensagem!
					</p>
				)}
				{messages.map((m) => (
					<div key={m.id} className="text-sm">
						<span className="font-semibold text-teal-600 dark:text-teal-400 mr-1.5">
							{m.user_name ?? 'Aluno'}
						</span>
						<span className="text-slate-700 dark:text-slate-300 break-words">
							{m.body}
						</span>
					</div>
				))}
				<div ref={bottomRef} />
			</div>
			<div className="p-3 border-t border-slate-200 dark:border-white/10 flex gap-2">
				<input
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && send()}
					placeholder="Escreva uma mensagem..."
					maxLength={500}
					className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
				/>
				<button
					type="button"
					onClick={send}
					disabled={post.isPending || !text.trim()}
					className="rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-3 py-2 transition"
				>
					<Send className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}
