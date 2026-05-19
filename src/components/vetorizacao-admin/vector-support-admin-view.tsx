'use client';

import {
	CheckCircle,
	Clock,
	Loader2,
	MessageSquare,
	Search,
	XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	useCloseVectorSupportTicket,
	useSendVectorSupportMessage,
	useVectorSupportTicket,
	useVectorSupportTicketsAdmin,
} from '@/hooks/use-vector-support';
import type { VectorSupportTicket } from '@/types/vector-support';
import { VectorSupportChat } from './vector-support-chat';

type StatusFilter = 'all' | 'open' | 'closed';

function statusBadge(status: string) {
	if (status === 'closed') {
		return (
			<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
				Fechado
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
			Aberto
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

export function VectorSupportAdminView() {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

	const { data: tickets = [], isLoading: ticketsLoading } =
		useVectorSupportTicketsAdmin();
	const { data: selectedTicket } = useVectorSupportTicket(
		selectedTicketId,
		!!selectedTicketId,
	);
	const sendMutation = useSendVectorSupportMessage();
	const closeMutation = useCloseVectorSupportTicket();

	const filteredTickets = useMemo(() => {
		let result = [...tickets];

		if (statusFilter !== 'all') {
			result = result.filter((t) => t.status === statusFilter);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(t) =>
					t.customerName?.toLowerCase().includes(q) ||
					t.subject?.toLowerCase().includes(q),
			);
		}

		result.sort((a, b) => {
			if (a.status === 'open' && b.status === 'closed') return -1;
			if (a.status === 'closed' && b.status === 'open') return 1;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

		return result;
	}, [tickets, statusFilter, searchQuery]);

	const openCount = tickets.filter((t) => t.status === 'open').length;
	const closedCount = tickets.filter((t) => t.status === 'closed').length;

	function handleReply(content: string, files?: File[]) {
		if (!selectedTicketId) return;
		sendMutation.mutate(
			{ ticketId: selectedTicketId, content, files },
			{
				onError: () => toast.error('Erro ao enviar mensagem'),
			},
		);
	}

	async function handleClose() {
		if (!selectedTicketId) return;
		if (!confirm('Fechar este chamado?')) return;
		try {
			await closeMutation.mutateAsync(selectedTicketId);
			toast.success('Chamado fechado!');
		} catch {
			toast.error('Erro ao fechar chamado');
		}
	}

	const STATUS_TABS: { key: StatusFilter; label: string }[] = [
		{ key: 'all', label: `Todos (${tickets.length})` },
		{ key: 'open', label: `Abertos (${openCount})` },
		{ key: 'closed', label: `Fechados (${closedCount})` },
	];

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Stats */}
			<div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
				{[
					{
						label: 'Abertos',
						value: openCount,
						color: 'text-amber-600 dark:text-amber-400',
					},
					{
						label: 'Fechados',
						value: closedCount,
						color: 'text-emerald-600 dark:text-emerald-400',
					},
					{
						label: 'Total',
						value: tickets.length,
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
								placeholder="Buscar por cliente ou assunto..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
							/>
						</div>

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
						{ticketsLoading ? (
							<div className="flex justify-center py-12">
								<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
							</div>
						) : filteredTickets.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-600">
								<MessageSquare className="w-8 h-8 mb-2 opacity-50" />
								<p className="text-sm font-medium">Nenhum chamado encontrado</p>
							</div>
						) : (
							filteredTickets.map((ticket) => (
								<button
									key={ticket.id}
									type="button"
									onClick={() => setSelectedTicketId(ticket.id)}
									className={`w-full text-left px-4 py-3.5 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
										selectedTicketId === ticket.id
											? 'bg-violet-50 dark:bg-violet-500/10 border-l-2 border-l-violet-500'
											: ''
									}`}
								>
									<div className="flex items-center justify-between gap-2 mb-1">
										<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
											{ticket.subject}
										</p>
										{statusBadge(ticket.status)}
									</div>
									<p className="text-xs text-slate-500 dark:text-slate-400 truncate">
										{ticket.customerName}
									</p>
									<div className="flex items-center mt-1.5">
										<span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{formatDate(ticket.createdAt)}
										</span>
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Right: chat panel */}
				<div className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden flex flex-col min-w-0">
					{selectedTicketId && selectedTicket ? (
						<>
							{/* Chat header */}
							<div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
								<div className="flex items-center justify-between">
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											{statusBadge(selectedTicket.status)}
										</div>
										<p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
											{selectedTicket.subject}
										</p>
										<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
											{selectedTicket.customerName}
										</p>
									</div>
									{selectedTicket.status !== 'closed' && (
										<button
											type="button"
											onClick={() => void handleClose()}
											disabled={closeMutation.isPending}
											className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg transition-colors"
										>
											<XCircle className="w-3.5 h-3.5" />
											Fechar
										</button>
									)}
								</div>
							</div>
							{/* Chat view */}
							<div className="flex-1 overflow-y-auto p-5">
								<VectorSupportChat
									ticket={selectedTicket}
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
		</div>
	);
}
