'use client';

import { Headset, Loader2, MessageSquare, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateSupportChat,
	useRequestHuman,
	useSendSupportMessage,
	useSupportChat,
} from '@/hooks/use-support-chat';
import type { SupportChatStatus } from '@/types/support-chat';
import { SupportMessageBubble } from './support-message-bubble';

const STATUS_BANNER: Record<SupportChatStatus, { label: string; cls: string }> =
	{
		ai: {
			label: 'Atendimento com assistente virtual',
			cls: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
		},
		waiting_human: {
			label: 'Aguardando um atendente…',
			cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
		},
		with_human: {
			label: 'Falando com um atendente',
			cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
		},
		closed: {
			label: 'Atendimento encerrado',
			cls: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400',
		},
	};

export interface SupportChatWidgetProps {
	isOpen: boolean;
	onClose: () => void;
}

export function SupportChatWidget({ isOpen, onClose }: SupportChatWidgetProps) {
	const [chatId, setChatId] = useState<string | null>(null);
	const [input, setInput] = useState('');
	const endRef = useRef<HTMLDivElement>(null);

	const createChat = useCreateSupportChat();
	const { data: chat } = useSupportChat(chatId, isOpen);
	const sendMessage = useSendSupportMessage(chatId);
	const requestHumanMutation = useRequestHuman(chatId);

	// Cria o chat ao abrir (uma vez); reaproveita se já existir.
	// biome-ignore lint/correctness/useExhaustiveDependencies: dispara só ao abrir
	useEffect(() => {
		if (isOpen && !chatId && !createChat.isPending) {
			createChat.mutate(undefined, {
				onSuccess: (c) => setChatId(c.id),
				onError: () =>
					toast.error('Não foi possível abrir o chat. Tente novamente.'),
			});
		}
	}, [isOpen]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: rola ao mudar mensagens
	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chat?.messages?.length]);

	if (!isOpen) return null;

	const status = chat?.status ?? 'ai';
	const banner = STATUS_BANNER[status];
	const isClosed = status === 'closed';

	function doSend() {
		const content = input.trim();
		if (!content || !chatId || isClosed) return;
		setInput('');
		sendMessage.mutate(content, {
			onError: () => toast.error('Erro ao enviar mensagem.'),
		});
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
			<div
				className="w-full sm:max-w-lg h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col bg-white dark:bg-[#0d0d0f] sm:border border-slate-200 dark:border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden"
				role="dialog"
				aria-modal="true"
				aria-label="Chat de suporte"
			>
				{/* Header */}
				<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center">
							<MessageSquare className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-base font-bold text-slate-900 dark:text-white">
								Suporte ao vivo
							</h2>
							<p className="text-xs text-slate-500 dark:text-gray-400">
								Resposta rápida com IA + atendentes
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Status banner */}
				<div className={`px-5 py-2 text-xs font-medium shrink-0 ${banner.cls}`}>
					{status === 'with_human' && chat?.attendantName
						? `Falando com ${chat.attendantName}`
						: banner.label}
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px]">
					{!chat ? (
						<div className="flex items-center justify-center h-full text-slate-400">
							<Loader2 className="w-6 h-6 animate-spin" />
						</div>
					) : (
						(chat.messages ?? []).map((m) => (
							<SupportMessageBubble key={m.id} msg={m} />
						))
					)}
					<div ref={endRef} />
				</div>

				{/* Falar com atendente */}
				{status === 'ai' && chat && (
					<div className="px-4 pb-2 shrink-0">
						<button
							type="button"
							onClick={() => requestHumanMutation.mutate()}
							disabled={requestHumanMutation.isPending}
							className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-xl transition-colors disabled:opacity-50"
						>
							<Headset className="w-4 h-4" />
							Falar com um atendente
						</button>
					</div>
				)}

				{/* Composer */}
				<form
					onSubmit={(e) => {
						e.preventDefault();
						doSend();
					}}
					className="flex items-end gap-2 p-4 border-t border-slate-200 dark:border-white/10 shrink-0"
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
						disabled={isClosed || !chatId}
						placeholder={
							isClosed ? 'Atendimento encerrado' : 'Escreva sua mensagem...'
						}
						rows={1}
						className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none text-sm resize-none max-h-32 disabled:opacity-60"
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
			</div>
		</div>
	);
}
