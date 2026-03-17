'use client';

import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useDoubtChat,
	useDoubtChats,
	useSendDoubtMessage,
} from '@/hooks/use-doubt-chat';
import type { DoubtChat } from '@/types/doubt-chat';
import { DoubtChatView } from './doubt-chat-view';
import { DoubtsList } from './doubts-list';
import { NewDoubtFlow } from './new-doubt-flow';

export interface DoubtsClientViewProps {
	customerId: string;
	customerName: string;
	hasAccess: boolean;
	defaultTab?: 'pending' | 'answered';
}

export function DoubtsClientView({
	customerId,
	customerName,
	hasAccess,
	defaultTab = 'pending',
}: DoubtsClientViewProps) {
	const [activeTab, setActiveTab] = useState<'pending' | 'answered'>(
		defaultTab,
	);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [newDoubtOpen, setNewDoubtOpen] = useState(false);

	const { data: chats = [], isLoading: chatsLoading } = useDoubtChats('all');
	const { data: selectedChat, isLoading: chatLoading } = useDoubtChat(
		selectedChatId,
		!!selectedChatId,
	);
	const sendMessageMutation = useSendDoubtMessage(selectedChatId);

	function handleChatCreated(chat: DoubtChat) {
		setSelectedChatId(chat.id);
		setActiveTab('pending');
	}

	async function handleSendMessage(content: string, file?: File) {
		if (!selectedChatId) return;
		try {
			await sendMessageMutation.mutateAsync({ content, file });
			toast.success('Mensagem enviada!');
		} catch {
			toast.error('Erro ao enviar mensagem. Tente novamente.');
		}
	}

	if (!hasAccess) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-600">
				<MessageSquare className="w-16 h-16 mb-4 opacity-50" />
				<p className="text-sm font-medium">
					Dúvidas disponível no plano Ouro ou Platina
				</p>
				<p className="text-xs mt-1">
					Faça upgrade para enviar dúvidas aos técnicos.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header + Nova dúvida */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Suas dúvidas
					</h2>
					<p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
						Chat direto com os nossos técnicos
					</p>
				</div>
				<button
					type="button"
					onClick={() => setNewDoubtOpen(true)}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
				>
					<Plus className="w-4 h-4" />
					Nova dúvida
				</button>
			</div>

			{/* Layout: lista à esquerda, chat à direita (ou full width em mobile) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-1">
					{chatsLoading ? (
						<div className="flex justify-center py-16">
							<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
						</div>
					) : (
						<DoubtsList
							chats={chats}
							activeTab={activeTab}
							onTabChange={setActiveTab}
							onSelectChat={(chat) => setSelectedChatId(chat.id)}
						/>
					)}
				</div>
				<div className="lg:col-span-2">
					{selectedChatId ? (
						<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
							{chatLoading ? (
								<div className="flex justify-center py-16">
									<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
								</div>
							) : selectedChat ? (
								<DoubtChatView
									chat={selectedChat}
									customerName={customerName}
									onSendMessage={handleSendMessage}
								/>
							) : null}
						</div>
					) : (
						<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px] text-slate-500 dark:text-slate-600">
							<MessageSquare className="w-12 h-12 mb-3 opacity-50" />
							<p className="text-sm font-medium">Selecione uma dúvida</p>
							<p className="text-xs mt-1">
								Escolha uma conversa na lista ou crie uma nova dúvida
							</p>
						</div>
					)}
				</div>
			</div>

			<NewDoubtFlow
				isOpen={newDoubtOpen}
				onClose={() => setNewDoubtOpen(false)}
				customerId={customerId}
				customerName={customerName}
				onChatCreated={handleChatCreated}
			/>
		</div>
	);
}
