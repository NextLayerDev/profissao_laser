'use client';

import {
	Clock,
	Headphones,
	Loader2,
	MessageSquare,
	Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DoubtChatView } from '@/components/duvidas/doubt-chat-view';
import { useDoubtChat } from '@/hooks/use-doubt-chat';
import {
	useDoubtCategoriesAdmin,
	useDoubtChatsAdmin,
	useReplyToDoubtChat,
} from '@/hooks/use-doubt-chat-admin';
import type { DoubtChat } from '@/types/doubt-chat';

type StatusFilter = 'all' | 'pending' | 'answered';

/**
 * Um chamado é "pendente" quando NÃO está respondido. O backend cria os chamados
 * como `'open'` (não `'pending'`) e só marca `'answered'` na resposta do técnico —
 * por isso não dá pra comparar `=== 'pending'` (isso zerava o card). O badge já
 * usa essa mesma regra (tudo != answered vira "Pendente").
 */
const isPending = (c: DoubtChat) => c.status !== 'answered';

function statusBadge(status: DoubtChat['status']) {
	if (status === 'answered') {
		return (
			<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
				Resolvido
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
			Pendente
		</span>
	);
}

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

function formatTicketNumber(chat: DoubtChat, index: number) {
	if (chat.ticketNumber != null) {
		return `#${String(chat.ticketNumber).padStart(3, '0')}`;
	}
	return `#${String(index + 1).padStart(3, '0')}`;
}

export function SuporteAdminView() {
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

	const { data: categories = [] } = useDoubtCategoriesAdmin();
	const { data: chats = [], isLoading: chatsLoading } = useDoubtChatsAdmin(
		categoryFilter === 'all' ? null : categoryFilter,
	);
	const { data: selectedChat } = useDoubtChat(selectedChatId, !!selectedChatId);
	const replyMutation = useReplyToDoubtChat();

	const filteredChats = useMemo(() => {
		let result = [...chats];

		if (statusFilter === 'pending') {
			result = result.filter(isPending);
		} else if (statusFilter === 'answered') {
			result = result.filter((c) => c.status === 'answered');
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(c) =>
					c.customerName?.toLowerCase().includes(q) ||
					c.categoryName?.toLowerCase().includes(q) ||
					String(c.ticketNumber ?? '').includes(q),
			);
		}

		result.sort((a, b) => {
			// Pendentes (não respondidos) primeiro, depois por data desc.
			const ap = isPending(a) ? 0 : 1;
			const bp = isPending(b) ? 0 : 1;
			if (ap !== bp) return ap - bp;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

		return result;
	}, [chats, statusFilter, searchQuery]);

	const pendingCount = chats.filter(isPending).length;
	const answeredCount = chats.filter((c) => c.status === 'answered').length;

	function handleReply(content: string, file?: File) {
		if (!selectedChatId) return;
		replyMutation.mutate({ chatId: selectedChatId, content, file });
	}

	const STATUS_TABS: { key: StatusFilter; label: string }[] = [
		{ key: 'all', label: `Todos (${chats.length})` },
		{ key: 'pending', label: `Pendentes (${pendingCount})` },
		{ key: 'answered', label: `Resolvidos (${answeredCount})` },
	];

	return (
		<main className="flex flex-col h-full overflow-hidden px-4 md:px-8 py-4">
			{/* Header */}
			<div className="shrink-0 mb-4">
				<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
					<Headphones className="w-6 h-6 text-violet-400" />
					Gestao de Suporte
				</h2>
				<p className="text-slate-600 dark:text-gray-400 mt-1">
					Visualize e responda aos chamados dos clientes.
				</p>
			</div>

			{/* Stats */}
			<div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
				{[
					{
						label: 'Pendentes',
						value: pendingCount,
						color: 'text-amber-600 dark:text-amber-400',
					},
					{
						label: 'Resolvidos',
						value: answeredCount,
						color: 'text-emerald-600 dark:text-emerald-400',
					},
					{
						label: 'Total',
						value: chats.length,
						color: 'text-violet-600 dark:text-violet-400',
					},
				].map((s) => (
					<div
						key={s.label}
						className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-center"
					>
						<p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
							{s.label}
						</p>
					</div>
				))}
			</div>

			{/* 2-column layout */}
			<div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
				{/* Left: ticket list */}
				<div className="w-full lg:w-[400px] shrink-0 flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
					{/* Filters */}
					<div className="p-4 border-b border-slate-200 dark:border-white/10 space-y-3">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								placeholder="Buscar por cliente ou ticket..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
							/>
						</div>

						{/* Category filter */}
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
						>
							<option value="all">Todas as categorias</option>
							{categories.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.title}
								</option>
							))}
						</select>

						{/* Status tabs */}
						<div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
							{STATUS_TABS.map((tab) => (
								<button
									key={tab.key}
									type="button"
									onClick={() => setStatusFilter(tab.key)}
									className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
										statusFilter === tab.key
											? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm'
											: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>

					{/* Ticket list */}
					<div className="flex-1 overflow-y-auto">
						{chatsLoading ? (
							<div className="flex justify-center py-12">
								<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
							</div>
						) : filteredChats.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-600">
								<MessageSquare className="w-8 h-8 mb-2 opacity-50" />
								<p className="text-sm font-medium">Nenhum chamado encontrado</p>
							</div>
						) : (
							filteredChats.map((chat, index) => (
								<button
									key={chat.id}
									type="button"
									onClick={() => setSelectedChatId(chat.id)}
									className={`w-full text-left px-4 py-3.5 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
										selectedChatId === chat.id
											? 'bg-violet-50 dark:bg-violet-500/10 border-l-2 border-l-violet-500'
											: ''
									}`}
								>
									<div className="flex items-center justify-between gap-2 mb-1">
										<span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
											{formatTicketNumber(chat, index)}
										</span>
										{statusBadge(chat.status)}
									</div>
									<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
										{chat.customerName ?? 'Cliente'}
									</p>
									<p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
										{chat.categoryName ?? 'Sem categoria'}
									</p>
									<div className="flex items-center justify-between mt-1.5">
										<span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{formatDate(chat.createdAt)}
										</span>
										{chat.messages && chat.messages.length > 0 && (
											<span className="text-xs text-slate-400 dark:text-slate-500">
												{chat.messages.length} msg
											</span>
										)}
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Right: chat panel */}
				<div className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden flex flex-col min-w-0">
					{selectedChatId && selectedChat ? (
						<>
							{/* Chat header */}
							<div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3 min-w-0">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
													#
													{String(selectedChat.ticketNumber ?? '').padStart(
														3,
														'0',
													)}
												</span>
												{statusBadge(selectedChat.status)}
											</div>
											<p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
												{selectedChat.customerName ?? 'Cliente'} —{' '}
												{selectedChat.categoryName ?? 'Chamado'}
											</p>
										</div>
									</div>
									{selectedChat.technicianName && (
										<span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
											Tecnico: {selectedChat.technicianName}
										</span>
									)}
								</div>
							</div>
							{/* Chat view */}
							<div className="flex-1 overflow-y-auto p-5">
								<DoubtChatView
									chat={selectedChat}
									customerName={selectedChat.customerName ?? 'Cliente'}
									onSendMessage={handleReply}
									isAdmin
								/>
							</div>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
							<MessageSquare className="w-12 h-12 mb-3 opacity-50" />
							<p className="text-sm font-medium">Selecione um chamado</p>
							<p className="text-xs mt-1">
								Escolha um ticket na lista para ver a conversa
							</p>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
