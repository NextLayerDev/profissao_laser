'use client';

import { Loader2, MessageSquare, Send, UserCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useAdminCloseSupportChat,
	useAdminSendMessage,
	useAdminSupportChat,
	useAdminSupportChats,
	useTakeOverSupportChat,
} from '@/hooks/use-support-chat-admin';
import { useAdminSupportNotifications } from '@/hooks/use-support-notifications';
import type { SupportChatStatus } from '@/types/support-chat';
import { SupportMessageBubble } from './support-message-bubble';

const FILTERS: { key: SupportChatStatus | 'all'; label: string }[] = [
	{ key: 'all', label: 'Todos' },
	{ key: 'waiting_human', label: 'Aguardando' },
	{ key: 'with_human', label: 'Em atendimento' },
	{ key: 'ai', label: 'Com IA' },
	{ key: 'closed', label: 'Encerrados' },
];

const STATUS_BADGE: Record<SupportChatStatus, { label: string; cls: string }> =
	{
		ai: {
			label: 'IA',
			cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
		},
		waiting_human: {
			label: 'Aguardando',
			cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
		},
		with_human: {
			label: 'Em atendimento',
			cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
		},
		closed: {
			label: 'Encerrado',
			cls: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-400',
		},
	};

function StatusBadge({ status }: { status: SupportChatStatus }) {
	const b = STATUS_BADGE[status];
	return (
		<span
			className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${b.cls}`}
		>
			{b.label}
		</span>
	);
}

export function SupportChatAdmin() {
	const [filter, setFilter] = useState<SupportChatStatus | 'all'>('all');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [input, setInput] = useState('');
	const endRef = useRef<HTMLDivElement>(null);

	const { data: chats = [], isLoading } = useAdminSupportChats(
		filter === 'all' ? undefined : filter,
	);
	const { data: chat } = useAdminSupportChat(selectedId);
	const sendMessage = useAdminSendMessage(selectedId);
	const takeOver = useTakeOverSupportChat(selectedId);
	const closeChat = useAdminCloseSupportChat(selectedId);
	const { unreadIds, markSeen } = useAdminSupportNotifications();

	// Chat aberto = lido (inclusive quando chega mensagem nova com ele aberto).
	useEffect(() => {
		if (selectedId && chat?.lastMessageAt) {
			markSeen(selectedId, chat.lastMessageAt);
		}
	}, [selectedId, chat?.lastMessageAt, markSeen]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: rola ao mudar mensagens
	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chat?.messages?.length]);

	function doSend() {
		const content = input.trim();
		if (!content || !selectedId) return;
		setInput('');
		sendMessage.mutate(content, {
			onError: () => toast.error('Erro ao enviar.'),
		});
	}

	const isClosed = chat?.status === 'closed';

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[480px]">
			{/* Lista */}
			<div className="flex flex-col rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
				<div className="flex flex-wrap gap-1.5 p-3 border-b border-slate-200 dark:border-white/10">
					{FILTERS.map((f) => (
						<button
							key={f.key}
							type="button"
							onClick={() => setFilter(f.key)}
							className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
								filter === f.key
									? 'bg-violet-600 text-white'
									: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
							}`}
						>
							{f.label}
						</button>
					))}
				</div>
				<div className="flex-1 overflow-y-auto">
					{isLoading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="w-5 h-5 animate-spin text-violet-500" />
						</div>
					) : chats.length === 0 ? (
						<p className="text-sm text-slate-500 dark:text-gray-400 text-center py-8">
							Nenhum chat.
						</p>
					) : (
						chats.map((c) => (
							<button
								key={c.id}
								type="button"
								onClick={() => setSelectedId(c.id)}
								className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-white/5 transition-colors ${
									selectedId === c.id
										? 'bg-violet-50 dark:bg-violet-500/10'
										: 'hover:bg-slate-50 dark:hover:bg-white/5'
								}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span className="flex items-center gap-1.5 min-w-0 text-sm font-semibold text-slate-900 dark:text-white">
										{unreadIds.has(c.id) && (
											<span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
										)}
										<span className="truncate">
											{c.customerName ?? 'Cliente'}
										</span>
									</span>
									<StatusBadge status={c.status} />
								</div>
								<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate">
									{unreadIds.has(c.id) && c.lastMessagePreview
										? c.lastMessagePreview
										: c.attendantName
											? `Atendente: ${c.attendantName}`
											: 'Sem atendente'}
								</p>
							</button>
						))
					)}
				</div>
			</div>

			{/* Painel */}
			<div className="flex flex-col rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
				{!selectedId || !chat ? (
					<div className="flex-1 flex items-center justify-center text-slate-400 dark:text-gray-600">
						<div className="text-center">
							<MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
							<p className="text-sm">Selecione um chat</p>
						</div>
					</div>
				) : (
					<>
						<div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-white/10">
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
										{chat.customerName ?? 'Cliente'}
									</span>
									<StatusBadge status={chat.status} />
								</div>
								{chat.attendantName && (
									<p className="text-xs text-slate-500 dark:text-gray-400">
										Atendente: {chat.attendantName}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2 shrink-0">
								{chat.status !== 'closed' && chat.status !== 'with_human' && (
									<button
										type="button"
										onClick={() => takeOver.mutate()}
										disabled={takeOver.isPending}
										className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
									>
										<UserCheck className="w-3.5 h-3.5" /> Assumir
									</button>
								)}
								{chat.status !== 'closed' && (
									<button
										type="button"
										onClick={() => closeChat.mutate()}
										disabled={closeChat.isPending}
										className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-50"
									>
										<X className="w-3.5 h-3.5" /> Encerrar
									</button>
								)}
							</div>
						</div>
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							{(chat.messages ?? []).map((m) => (
								<SupportMessageBubble key={m.id} msg={m} />
							))}
							<div ref={endRef} />
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								doSend();
							}}
							className="flex items-end gap-2 p-4 border-t border-slate-200 dark:border-white/10"
						>
							<textarea
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										doSend();
									}
								}}
								disabled={isClosed}
								placeholder={
									isClosed ? 'Atendimento encerrado' : 'Responder...'
								}
								rows={1}
								className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none text-sm resize-none max-h-32 disabled:opacity-60"
							/>
							<button
								type="submit"
								disabled={!input.trim() || isClosed || sendMessage.isPending}
								className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
								aria-label="Enviar"
							>
								{sendMessage.isPending ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Send className="w-5 h-5" />
								)}
							</button>
						</form>
					</>
				)}
			</div>
		</div>
	);
}
