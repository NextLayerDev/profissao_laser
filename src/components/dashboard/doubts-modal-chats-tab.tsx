'use client';

import {
	ChevronDown,
	ChevronRight,
	Loader2,
	MessageSquare,
	Settings,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DoubtChatView } from '@/components/duvidas/doubt-chat-view';
import { CategoriesSection } from '@/components/duvidas-admin/categories-section';
import { DefaultQuestionsSection } from '@/components/duvidas-admin/default-questions-section';
import { useDoubtChat } from '@/hooks/use-doubt-chat';
import {
	useDoubtCategoriesAdmin,
	useDoubtChatsAdmin,
	useReplyToDoubtChat,
} from '@/hooks/use-doubt-chat-admin';
import type { DoubtCategory, DoubtChat } from '@/types/doubt-chat';

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

function CategoriesModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
			<div className="absolute inset-0" onClick={onClose} aria-hidden />
			<div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col">
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Gerir categorias
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
						aria-label="Fechar"
					>
						<X className="w-5 h-5" />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6">
					<CategoriesSection />
				</div>
			</div>
		</div>
	);
}

function PreQualificationModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
			<div className="absolute inset-0" onClick={onClose} aria-hidden />
			<div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col">
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Perguntas padrão
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
						aria-label="Fechar"
					>
						<X className="w-5 h-5" />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6">
					<DefaultQuestionsSection />
				</div>
			</div>
		</div>
	);
}

function CategoryRow({
	category,
	expanded,
	onToggle,
	onChatOpen,
}: {
	category: DoubtCategory;
	expanded: boolean;
	onToggle: () => void;
	onChatOpen: (chatId: string) => void;
}) {
	const { data: chats = [], isLoading } = useDoubtChatsAdmin(
		category.id,
		expanded,
	);

	const pending = chats.filter((c) => c.status === 'pending').length;
	const answered = chats.filter((c) => c.status === 'answered').length;

	return (
		<div className="border-b border-slate-200 dark:border-white/5 last:border-0">
			<button
				type="button"
				onClick={onToggle}
				className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
			>
				{expanded ? (
					<ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
				) : (
					<ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
				)}
				<span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
					{category.title}
				</span>
				{isLoading && expanded ? (
					<Loader2 className="w-4 h-4 text-slate-500 dark:text-slate-400 animate-spin shrink-0" />
				) : (
					<span className="text-xs text-slate-600 dark:text-slate-500">
						{pending} pendente{pending !== 1 ? 's' : ''}, {answered} respondida
						{answered !== 1 ? 's' : ''}
					</span>
				)}
			</button>
			{expanded && (
				<div className="px-4 pb-4 space-y-2">
					{isLoading ? (
						<div className="flex items-center gap-2 py-4 text-slate-600 dark:text-slate-500">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span className="text-sm">A carregar chats...</span>
						</div>
					) : chats.length === 0 ? (
						<p className="text-sm text-slate-600 dark:text-slate-500 py-4">
							Nenhum chat nesta categoria ainda.
						</p>
					) : (
						chats.map((chat) => (
							<ChatRow
								key={chat.id}
								chat={chat}
								onOpen={() => onChatOpen(chat.id)}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
}

function ChatRow({ chat, onOpen }: { chat: DoubtChat; onOpen: () => void }) {
	return (
		<div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors">
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
					{chat.customerName ?? 'Cliente'} ·{' '}
					{chat.technicianName ?? 'Sem técnico'}
				</p>
				<p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">
					{formatDate(chat.updatedAt)} ·{' '}
					<span
						className={
							chat.status === 'pending'
								? 'text-amber-400 font-medium'
								: 'text-emerald-400'
						}
					>
						{chat.status === 'pending' ? 'Pendente' : 'Respondida'}
					</span>
				</p>
			</div>
			<button
				type="button"
				onClick={onOpen}
				className="shrink-0 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
			>
				Abrir
			</button>
		</div>
	);
}

export function ChatsWithTechniciansTab() {
	const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
		new Set(),
	);
	const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
	const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

	const { data: categories = [], isLoading } = useDoubtCategoriesAdmin();

	function toggleCategory(id: string) {
		setExpandedCategoryIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	return (
		<div className="flex flex-col h-full">
			{/* Header de ações */}
			<div className="flex flex-wrap gap-2 mb-4 shrink-0">
				<button
					type="button"
					onClick={() => setCategoriesModalOpen(true)}
					className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium text-slate-900 dark:text-white transition-colors"
				>
					<Settings className="w-4 h-4" />
					Gerir categorias
				</button>
				<button
					type="button"
					onClick={() => setQuestionsModalOpen(true)}
					className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium text-slate-900 dark:text-white transition-colors"
				>
					<Settings className="w-4 h-4" />
					Perguntas padrão
				</button>
			</div>

			{/* Lista de categorias */}
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-20">
						<Loader2 className="w-10 h-10 text-violet-500 dark:text-violet-400 animate-spin mb-4" />
						<p className="text-slate-600 dark:text-slate-500">
							A carregar categorias...
						</p>
					</div>
				) : categories.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-slate-600 dark:text-slate-500">
						<MessageSquare className="w-12 h-12 mb-4 opacity-50" />
						<p className="text-sm">Nenhuma categoria configurada.</p>
						<p className="text-xs mt-1">
							Use &quot;Gerir categorias&quot; para criar.
						</p>
					</div>
				) : (
					<div className="space-y-0">
						{categories.map((cat) => (
							<CategoryRow
								key={cat.id}
								category={cat}
								expanded={expandedCategoryIds.has(cat.id)}
								onToggle={() => toggleCategory(cat.id)}
								onChatOpen={setSelectedChatId}
							/>
						))}
					</div>
				)}
			</div>

			<CategoriesModal
				open={categoriesModalOpen}
				onClose={() => setCategoriesModalOpen(false)}
			/>
			<PreQualificationModal
				open={questionsModalOpen}
				onClose={() => setQuestionsModalOpen(false)}
			/>

			{selectedChatId && (
				<AdminChatViewPanel
					chatId={selectedChatId}
					onClose={() => setSelectedChatId(null)}
				/>
			)}
		</div>
	);
}

function AdminChatViewPanel({
	chatId,
	onClose,
}: {
	chatId: string;
	onClose: () => void;
}) {
	const { data: chat, isLoading } = useDoubtChat(chatId, !!chatId);
	const replyMutation = useReplyToDoubtChat();

	async function handleSendMessage(content: string) {
		try {
			await replyMutation.mutateAsync({ chatId, content });
			toast.success('Resposta enviada!');
		} catch {
			toast.error('Erro ao enviar resposta');
		}
	}

	return (
		<div className="fixed inset-0 z-[55] flex flex-col bg-white dark:bg-[#0d0d0f] border-l border-slate-200 dark:border-white/10 shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:rounded-l-2xl">
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
				<button
					type="button"
					onClick={onClose}
					className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
				>
					← Voltar
				</button>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-20">
						<Loader2 className="w-10 h-10 text-violet-500 dark:text-violet-400 animate-spin mb-4" />
						<p className="text-slate-600 dark:text-slate-500">
							A carregar chat...
						</p>
					</div>
				) : chat ? (
					<>
						<div className="mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
							<p className="text-sm font-medium text-slate-900 dark:text-white">
								{chat.customerName ?? 'Cliente'} · Técnico:{' '}
								{chat.technicianName ?? '—'}
							</p>
							{chat.qualificationAnswers &&
								Object.keys(chat.qualificationAnswers).length > 0 && (
									<p className="text-xs text-slate-600 dark:text-slate-500 mt-1">
										Qualificação:{' '}
										{Object.entries(chat.qualificationAnswers)
											.map(([k, v]) => `${k}=${v}`)
											.join(', ')}
									</p>
								)}
						</div>
						<DoubtChatView
							chat={chat}
							customerName={chat.customerName ?? 'Cliente'}
							onSendMessage={handleSendMessage}
						/>
					</>
				) : (
					<p className="text-slate-600 dark:text-slate-500 text-sm">
						Chat não encontrado.
					</p>
				)}
			</div>
		</div>
	);
}
