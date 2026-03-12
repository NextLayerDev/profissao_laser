'use client';

import { ChevronRight, MessageSquare } from 'lucide-react';
import type { DoubtChat } from '@/types/doubt-chat';

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-PT', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

export interface DoubtsListProps {
	chats: DoubtChat[];
	activeTab: 'pending' | 'answered';
	onTabChange: (tab: 'pending' | 'answered') => void;
	onSelectChat: (chat: DoubtChat) => void;
}

export function DoubtsList({
	chats,
	activeTab,
	onTabChange,
	onSelectChat,
}: DoubtsListProps) {
	const pendingChats = chats.filter((c) => c.status === 'pending');
	const answeredChats = chats.filter((c) => c.status === 'answered');
	const displayedChats = activeTab === 'pending' ? pendingChats : answeredChats;

	return (
		<div className="space-y-4">
			{/* Tabs */}
			<div className="flex gap-1 border-b border-slate-200 dark:border-white/10 -mb-px">
				<button
					type="button"
					onClick={() => onTabChange('pending')}
					className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
						activeTab === 'pending'
							? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
							: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
					}`}
				>
					Pendentes
					{pendingChats.length > 0 && (
						<span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
							{pendingChats.length}
						</span>
					)}
				</button>
				<button
					type="button"
					onClick={() => onTabChange('answered')}
					className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
						activeTab === 'answered'
							? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
							: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
					}`}
				>
					Respondidas
				</button>
			</div>

			{/* Lista de chats */}
			<div className="space-y-2">
				{displayedChats.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600">
						<MessageSquare className="w-12 h-12 mb-3 opacity-50" />
						<p className="text-sm font-medium">
							{activeTab === 'pending'
								? 'Nenhuma dúvida pendente'
								: 'Nenhuma dúvida respondida'}
						</p>
						<p className="text-xs mt-1">
							{activeTab === 'pending'
								? 'Crie uma nova dúvida para começar'
								: 'As respostas aparecerão aqui'}
						</p>
					</div>
				) : (
					displayedChats.map((chat) => {
						const messages = chat.messages ?? [];
						const lastMessage = messages[messages.length - 1];
						return (
							<button
								key={chat.id}
								type="button"
								onClick={() => onSelectChat(chat)}
								className="w-full flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-left hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
							>
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
									<MessageSquare className="w-5 h-5 text-white" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="font-medium text-slate-900 dark:text-white truncate">
											{chat.categoryName}
										</span>
										{chat.technicianName && (
											<span className="text-xs text-slate-500 dark:text-slate-400">
												· {chat.technicianName}
											</span>
										)}
									</div>
									{lastMessage && (
										<p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
											{lastMessage.content}
										</p>
									)}
									<p className="text-xs text-slate-500 mt-1">
										{formatDate(chat.updatedAt)}
									</p>
								</div>
								<ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
