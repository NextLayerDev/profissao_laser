'use client';

import {
	ArrowLeft,
	Headset,
	Info,
	Loader2,
	MessageSquare,
	Send,
	X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ModalPortal } from '@/components/ui/modal-portal';
import {
	useCreateSupportChat,
	useRequestHuman,
	useSendSupportMessage,
	useSupportChat,
	useSupportChats,
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

const NEW_CHAT_BANNER = {
	label: 'Escreva sua mensagem para iniciar o atendimento',
	cls: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400',
};

export interface SupportChatWidgetProps {
	isOpen: boolean;
	onClose: () => void;
	/**
	 * Quando preenchido, o widget abre ESTE atendimento em modo leitura — é o
	 * caminho usado pelo histórico de atendimentos encerrados.
	 */
	viewChatId?: string | null;
	/** Troca (ou limpa, com null) o atendimento aberto em modo leitura. */
	onViewChatId?: (id: string | null) => void;
}

export function SupportChatWidget({
	isOpen,
	onClose,
	viewChatId = null,
	onViewChatId,
}: SupportChatWidgetProps) {
	const [input, setInput] = useState('');
	// Aviso de "você já tinha um atendimento aberto" (resposta reused do POST).
	const [reusedNotice, setReusedNotice] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);

	// O SERVIDOR manda: o atendimento ativo vem da lista, não de estado local.
	const { activeChat, isLoading: listLoading } = useSupportChats(isOpen);
	const createChat = useCreateSupportChat();

	// Último atendimento visto nesta sessão. Cobre os dois momentos em que a
	// lista do servidor ainda não reflete a tela: logo após criar o chat (a
	// lista só revalida depois) e logo após o staff encerrar (aí queremos manter
	// a conversa visível em vez de sumir com ela na cara do aluno).
	// Nunca é usado pra "adivinhar" um atendimento aberto: activeChat tem
	// prioridade e sempre vence.
	const [lastChatId, setLastChatId] = useState<string | null>(null);
	useEffect(() => {
		if (activeChat?.id) setLastChatId(activeChat.id);
	}, [activeChat?.id]);

	// Em modo leitura o chat visto é o do histórico; caso contrário, o ativo.
	const isReadOnly = !!viewChatId;
	const chatId = viewChatId ?? activeChat?.id ?? lastChatId;
	const { data: chat } = useSupportChat(chatId, isOpen);
	const sendMessage = useSendSupportMessage(chatId);
	const requestHumanMutation = useRequestHuman(chatId);

	// biome-ignore lint/correctness/useExhaustiveDependencies: rola pro fim ao mudar mensagens
	useEffect(() => {
		const el = listRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [chat?.messages?.length]);

	// Fechar o widget limpa o aviso pra ele não reaparecer na próxima abertura.
	useEffect(() => {
		if (!isOpen) setReusedNotice(false);
	}, [isOpen]);

	if (!isOpen) return null;

	const status = chat?.status ?? null;
	const banner = status ? STATUS_BANNER[status] : NEW_CHAT_BANNER;
	const isClosed = status === 'closed';
	// Sem atendimento aberto ainda: o aluno vê o convite pra começar.
	const isEmptyState = !chatId && !listLoading;
	const canType = !isReadOnly && !isClosed;

	/**
	 * Cria um atendimento novo. Nunca cria um segundo quando já existe um em
	 * andamento — nesse caso o botão só leva o aluno pro atendimento existente.
	 */
	function startNew() {
		if (activeChat) {
			onViewChatId?.(null);
			return;
		}
		createChat.mutate(undefined, {
			onSuccess: (c) => {
				setLastChatId(c.id);
				onViewChatId?.(null);
				if (c.reused) setReusedNotice(true);
			},
			onError: () =>
				toast.error('Não foi possível abrir o chat. Tente novamente.'),
		});
	}

	function doSend() {
		const content = input.trim();
		if (!content || !canType || createChat.isPending) return;
		setInput('');

		// Primeira mensagem sem atendimento aberto: o próprio POST cria (ou
		// reaproveita, se outra aba tiver criado antes) e já registra a mensagem.
		if (!chatId) {
			createChat.mutate(content, {
				onSuccess: (c) => {
					setLastChatId(c.id);
					if (c.reused) setReusedNotice(true);
				},
				onError: () => {
					setInput(content);
					toast.error('Não foi possível iniciar o atendimento. Tente de novo.');
				},
			});
			return;
		}

		sendMessage.mutate(content, {
			onError: () => {
				setInput(content);
				toast.error('Erro ao enviar mensagem.');
			},
		});
	}

	return (
		<ModalPortal>
			<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
				<div
					className="w-full sm:max-w-lg h-[100dvh] sm:h-[600px] sm:max-h-[85vh] flex flex-col bg-white dark:bg-[#0d0d0f] sm:border border-slate-200 dark:border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden"
					role="dialog"
					aria-modal="true"
					aria-label="Chat de suporte"
				>
					{/* Header */}
					<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
						<div className="flex items-center gap-3 min-w-0">
							{isReadOnly && (
								<button
									type="button"
									onClick={() => onViewChatId?.(null)}
									aria-label="Voltar"
									className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
								>
									<ArrowLeft className="w-4 h-4" />
								</button>
							)}
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center shrink-0">
								<MessageSquare className="w-5 h-5 text-white" />
							</div>
							<div className="min-w-0">
								<h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
									{isReadOnly ? 'Atendimento anterior' : 'Suporte ao vivo'}
								</h2>
								<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
									{isReadOnly
										? 'Somente leitura'
										: 'Resposta rápida com IA + atendentes'}
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							aria-label="Fechar"
							className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Status banner */}
					<div
						className={`px-5 py-2 text-xs font-medium shrink-0 ${banner.cls}`}
					>
						{status === 'with_human' && chat?.attendantName
							? `Falando com ${chat.attendantName}`
							: banner.label}
					</div>

					{/* Aviso: já existia um atendimento aberto (não é erro) */}
					{reusedNotice && (
						<div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20 shrink-0">
							<Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
							<p className="text-xs text-amber-800 dark:text-amber-200 flex-1">
								Você já tinha um atendimento em andamento. Sua mensagem foi
								adicionada nele para o atendente ver tudo junto.
							</p>
							<button
								type="button"
								onClick={() => setReusedNotice(false)}
								aria-label="Fechar aviso"
								className="text-amber-600 dark:text-amber-400 hover:opacity-70 shrink-0"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>
					)}

					{/* Messages — área de rolagem própria, sempre no fim */}
					<div
						ref={listRef}
						className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
					>
						{isEmptyState ? (
							<div className="flex flex-col items-center justify-center h-full text-center px-6">
								<div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3">
									<MessageSquare className="w-6 h-6 text-violet-600 dark:text-violet-400" />
								</div>
								<p className="text-sm font-semibold text-slate-900 dark:text-white">
									Como podemos te ajudar?
								</p>
								<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
									Escreva sua mensagem abaixo e nosso atendimento começa na
									hora.
								</p>
							</div>
						) : !chat ? (
							<div className="flex items-center justify-center h-full text-slate-400">
								<Loader2 className="w-6 h-6 animate-spin" />
							</div>
						) : (
							(chat.messages ?? []).map((m) => (
								<SupportMessageBubble key={m.id} msg={m} />
							))
						)}
					</div>

					{/* Falar com atendente */}
					{status === 'ai' && chat && !isReadOnly && (
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

					{/* Rodapé: leitura (histórico), encerrado ou composer */}
					{isReadOnly ? (
						<div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0">
							<button
								type="button"
								onClick={() => onViewChatId?.(null)}
								className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 font-semibold rounded-xl transition-colors"
							>
								<ArrowLeft className="w-4 h-4" />
								{activeChat
									? 'Voltar ao atendimento em andamento'
									: 'Voltar ao atendimento'}
							</button>
						</div>
					) : isClosed ? (
						<div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0">
							<button
								type="button"
								onClick={startNew}
								disabled={createChat.isPending}
								className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
							>
								{createChat.isPending ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<>
										<MessageSquare className="w-4 h-4" />
										Iniciar novo atendimento
									</>
								)}
							</button>
						</div>
					) : (
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
								disabled={listLoading}
								placeholder="Escreva sua mensagem..."
								rows={1}
								className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none text-sm resize-none max-h-32 disabled:opacity-60"
							/>
							<button
								type="submit"
								disabled={
									!input.trim() || sendMessage.isPending || createChat.isPending
								}
								className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
								aria-label="Enviar"
							>
								{sendMessage.isPending || createChat.isPending ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Send className="w-5 h-5" />
								)}
							</button>
						</form>
					)}
				</div>
			</div>
		</ModalPortal>
	);
}
