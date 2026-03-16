'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	ArrowLeft,
	ArrowRight,
	Loader2,
	MessageSquare,
	Send,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateDoubtChat,
	useDoubtCategories,
	useSendDoubtMessage,
} from '@/hooks/use-doubt-chat';
import { assignRandomTechnician } from '@/services/doubt-chat';
import type { DoubtChat } from '@/types/doubt-chat';
import { DoubtChatView } from './doubt-chat-view';

export interface NewDoubtFlowProps {
	isOpen: boolean;
	onClose: () => void;
	customerId: string;
	customerName: string;
	onChatCreated: (chat: DoubtChat) => void;
}

const STEPS = ['Categoria', 'Mensagem'] as const;

export function NewDoubtFlow({
	isOpen,
	onClose,
	customerName,
	onChatCreated,
}: NewDoubtFlowProps) {
	const [step, setStep] = useState(0);
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [initialMessage, setInitialMessage] = useState('');
	const [createdChat, setCreatedChat] = useState<DoubtChat | null>(null);

	const { data: categories = [], isLoading: categoriesLoading } =
		useDoubtCategories(isOpen);

	const qc = useQueryClient();
	const createChatMutation = useCreateDoubtChat();
	const sendMessageMutation = useSendDoubtMessage(createdChat?.id ?? null);

	function reset() {
		setStep(0);
		setCategoryId(null);
		setInitialMessage('');
		setCreatedChat(null);
	}

	function handleClose() {
		reset();
		onClose();
	}

	async function handleNext() {
		if (step < STEPS.length - 1) {
			setStep((s) => s + 1);
			return;
		}

		if (!categoryId || !initialMessage.trim()) return;

		try {
			const chat = await createChatMutation.mutateAsync({
				categoryId,
				initialMessage: initialMessage.trim(),
			});
			try {
				await assignRandomTechnician(chat.id);
				await qc.invalidateQueries({ queryKey: ['doubt-chat'] });
			} catch {
				// falha silenciosa — o chat foi criado, apenas o técnico não foi atribuído
			}
			setCreatedChat(chat);
			onChatCreated(chat);
			toast.success('Dúvida enviada!');
		} catch {
			toast.error('Erro ao enviar dúvida. Tente novamente.');
		}
	}

	async function handleSendMessage(content: string) {
		if (!createdChat) return;
		try {
			const newMessage = await sendMessageMutation.mutateAsync(content);
			setCreatedChat((prev) =>
				prev
					? {
							...prev,
							messages: [...(prev.messages ?? []), newMessage],
						}
					: null,
			);
			toast.success('Mensagem enviada!');
		} catch {
			toast.error('Erro ao enviar mensagem. Tente novamente.');
		}
	}

	const canProceed =
		(step === 0 && categoryId) ||
		(step === 1 && initialMessage.trim().length > 0);

	const isLoading = createChatMutation.isPending;

	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
				onClick={handleClose}
				aria-hidden
			/>
			<div
				className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex flex-col bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
				role="dialog"
				aria-modal="true"
				aria-labelledby="new-doubt-title"
			>
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
							<MessageSquare className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2
								id="new-doubt-title"
								className="text-lg font-bold text-slate-900 dark:text-white"
							>
								{createdChat ? 'Sua dúvida' : `Nova dúvida - ${STEPS[step]}`}
							</h2>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{createdChat
									? 'Pode continuar a conversa aqui'
									: `Passo ${step + 1} de ${STEPS.length}`}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
						aria-label="Fechar"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					{createdChat ? (
						<DoubtChatView
							chat={createdChat}
							customerName={customerName}
							onSendMessage={handleSendMessage}
						/>
					) : (
						<>
							{/* Progress */}
							<div className="flex gap-2 mb-6">
								{STEPS.map((s, i) => (
									<div
										key={s}
										className={`h-1 flex-1 rounded-full ${
											i <= step
												? 'bg-violet-500'
												: 'bg-slate-200 dark:bg-white/10'
										}`}
									/>
								))}
							</div>

							{step === 0 && (
								<fieldset
									className="space-y-3 border-0 p-0 m-0"
									aria-labelledby="category-heading"
								>
									<legend
										id="category-heading"
										className="text-sm font-medium text-slate-700 dark:text-gray-300"
									>
										Escolha a categoria da sua dúvida
									</legend>
									{categoriesLoading ? (
										<div className="flex justify-center py-8">
											<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
										</div>
									) : (
										<div className="space-y-2">
											{categories.map((cat) => (
												<button
													key={cat.id}
													type="button"
													onClick={() => setCategoryId(cat.id)}
													className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
														categoryId === cat.id
															? 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/20'
															: 'border-slate-200 dark:border-white/10 hover:border-violet-500/40'
													}`}
												>
													<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
														<MessageSquare className="w-5 h-5 text-white" />
													</div>
													<div>
														<p className="font-medium text-slate-900 dark:text-white">
															{cat.title}
														</p>
														{cat.description && (
															<p className="text-xs text-slate-500 dark:text-slate-400">
																{cat.description}
															</p>
														)}
													</div>
												</button>
											))}
										</div>
									)}
								</fieldset>
							)}

							{step === 1 && (
								<div className="space-y-3">
									<label
										htmlFor="initial-message"
										className="text-sm font-medium text-slate-700 dark:text-gray-300 block"
									>
										Escreva a sua dúvida
									</label>
									<textarea
										id="initial-message"
										value={initialMessage}
										onChange={(e) => setInitialMessage(e.target.value)}
										placeholder="Descreva o seu problema ou dúvida em detalhe..."
										rows={5}
										className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none text-sm resize-none"
									/>
								</div>
							)}
						</>
					)}
				</div>

				{!createdChat && (
					<div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
						<button
							type="button"
							onClick={() => (step > 0 ? setStep((s) => s - 1) : handleClose())}
							disabled={isLoading}
							className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
						>
							<ArrowLeft className="w-4 h-4" />
							{step === 0 ? 'Cancelar' : 'Voltar'}
						</button>
						<button
							type="button"
							onClick={() => void handleNext()}
							disabled={!canProceed || isLoading}
							className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
						>
							{isLoading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : step === STEPS.length - 1 ? (
								<>
									<Send className="w-4 h-4" />
									Enviar dúvida
								</>
							) : (
								<>
									Avançar
									<ArrowRight className="w-4 h-4" />
								</>
							)}
						</button>
					</div>
				)}
			</div>
		</>
	);
}
