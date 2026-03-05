'use client';

import { MessageSquare, Plus } from 'lucide-react';
import { useState } from 'react';
import type { DoubtChat } from '@/types/doubt-chat';
import {
	addMockMessage,
	getMockChatById,
	getMockChatsByCustomer,
} from '@/utils/mock/doubt-chat-mock';
import { DoubtChatView } from './doubt-chat-view';
import { DoubtsList } from './doubts-list';
import { NewDoubtFlow } from './new-doubt-flow';

export interface DoubtsClientViewProps {
	customerId: string;
	customerName: string;
	hasAccess: boolean;
}

export function DoubtsClientView({
	customerId,
	customerName,
	hasAccess,
}: DoubtsClientViewProps) {
	const [activeTab, setActiveTab] = useState<'pending' | 'answered'>('pending');
	const [selectedChat, setSelectedChat] = useState<DoubtChat | null>(null);
	const [newDoubtOpen, setNewDoubtOpen] = useState(false);

	// Mock: dados em memória (sem API)
	const chats = getMockChatsByCustomer(customerId, 'all');

	function handleChatCreated(chat: DoubtChat) {
		setSelectedChat(chat);
		setActiveTab('pending');
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
					<DoubtsList
						chats={chats}
						activeTab={activeTab}
						onTabChange={setActiveTab}
						onSelectChat={setSelectedChat}
					/>
				</div>
				<div className="lg:col-span-2">
					{selectedChat ? (
						<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
							<DoubtChatView
								chat={selectedChat}
								customerName={customerName}
								onSendMessage={(content) => {
									addMockMessage(selectedChat.id, {
										content,
										authorId: customerId,
										authorName: customerName,
										isTechnician: false,
									});
									const updated = getMockChatById(selectedChat.id);
									if (updated) setSelectedChat({ ...updated });
								}}
							/>
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
