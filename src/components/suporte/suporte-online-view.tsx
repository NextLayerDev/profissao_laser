'use client';

import {
	ArrowLeft,
	BookOpen,
	ChevronRight,
	Clock,
	ExternalLink,
	FileText,
	Headphones,
	HelpCircle,
	Loader2,
	MessageSquare,
	Play,
	X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DoubtChatView } from '@/components/duvidas/doubt-chat-view';
import { NewDoubtFlow } from '@/components/duvidas/new-doubt-flow';
import { PageHeader } from '@/components/ui/page-header';
import {
	useDoubtChat,
	useDoubtChatStats,
	useDoubtChats,
	useSendDoubtMessage,
} from '@/hooks/use-doubt-chat';
import { useFAQs } from '@/hooks/use-faq';
import { useKnowledgeBase } from '@/hooks/use-knowledge-base';
import type { DoubtChat } from '@/types/doubt-chat';

const ACTION_CARDS = [
	{
		id: 'novo-chamado',
		icon: MessageSquare,
		title: 'Abrir chamado',
		description: 'Envie sua duvida para nossos tecnicos',
	},
	{
		id: 'faq',
		icon: HelpCircle,
		title: 'Perguntas frequentes',
		description: 'Respostas para as duvidas mais comuns',
	},
	{
		id: 'base',
		icon: BookOpen,
		title: 'Base de conhecimento',
		description: 'Artigos e guias detalhados',
	},
	{
		id: 'videos',
		icon: Play,
		title: 'Videos tutoriais',
		description: 'Aprenda com video aulas praticas',
	},
] as const;

/* ─── Status helpers ──────────────────────────────────────────────────────── */

function statusBadge(status: DoubtChat['status']) {
	if (status === 'answered') {
		return (
			<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
				Resolvido
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
			Aberto
		</span>
	);
}

function formatTicketNumber(chat: DoubtChat, index: number) {
	if (chat.ticketNumber != null) {
		return `#${String(chat.ticketNumber).padStart(3, '0')}`;
	}
	return `#${String(index + 1).padStart(3, '0')}`;
}

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	} catch {
		return iso;
	}
}

/* ─── Props ───────────────────────────────────────────────────────────────── */

export interface SuporteOnlineViewProps {
	customerId: string;
	customerName: string;
	hasAccess: boolean;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function SuporteOnlineView({
	customerId,
	customerName,
	hasAccess,
}: SuporteOnlineViewProps) {
	const [newDoubtOpen, setNewDoubtOpen] = useState(false);
	const [activeSection, setActiveSection] = useState<
		'home' | 'faq' | 'base' | 'videos'
	>('home');
	const [showAllChats, setShowAllChats] = useState(false);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

	const { data: allChats = [] } = useDoubtChats('all', hasAccess);
	const { data: selectedChat } = useDoubtChat(selectedChatId, !!selectedChatId);
	const sendMsgMutation = useSendDoubtMessage(selectedChatId);
	const { data: faqs = [] } = useFAQs(hasAccess);
	const { data: stats } = useDoubtChatStats(hasAccess);
	const { data: knowledgeBaseArticles = [], isLoading: kbLoading } =
		useKnowledgeBase(undefined, hasAccess);

	const sortedChats = useMemo(() => {
		return [...allChats].sort((a, b) => {
			if (a.status === 'pending' && b.status === 'answered') return -1;
			if (a.status === 'answered' && b.status === 'pending') return 1;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [allChats]);

	const VISIBLE_LIMIT = 5;
	const visibleChats = showAllChats
		? sortedChats
		: sortedChats.slice(0, VISIBLE_LIMIT);
	const hasMore = sortedChats.length > VISIBLE_LIMIT;

	function handleChatCreated(_chat: DoubtChat) {
		setNewDoubtOpen(false);
	}

	function handleActionClick(id: string) {
		if (id === 'novo-chamado') {
			setNewDoubtOpen(true);
		} else if (id === 'faq') {
			setActiveSection('faq');
		} else if (id === 'base') {
			setActiveSection('base');
		} else if (id === 'videos') {
			setActiveSection('videos');
		}
	}

	function handleSendChatMessage(content: string, file?: File) {
		sendMsgMutation.mutate({ content, file });
	}

	return (
		<div className="relative px-4 py-6 md:px-8 md:py-10 space-y-8">
			{/* ── 1. Hero Banner ─────────────────────────────────────────────── */}
			<PageHeader
				title="Ola, vamos te ajudar!"
				subtitle="Nossa equipe esta pronta para resolver suas duvidas e problemas."
				icon={Headphones}
				variant="featured"
				backgroundImage="/img/suport-min.jpg"
			/>

			{/* ── Stats counters ───────────────────────────────────────────── */}
			{stats && (
				<section className="grid grid-cols-3 gap-4">
					{[
						{
							label: 'Abertos',
							value: stats.pending,
							color: 'text-violet-700 dark:text-violet-400',
						},
						{
							label: 'Resolvidos',
							value: stats.answered,
							color: 'text-emerald-600 dark:text-emerald-400',
						},
						{
							label: 'Total',
							value: stats.total,
							color: 'text-violet-700 dark:text-violet-400',
						},
					].map((s) => (
						<div
							key={s.label}
							className="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-center"
						>
							<p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
							<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
								{s.label}
							</p>
						</div>
					))}
				</section>
			)}

			{/* ── 2. Action Cards ────────────────────────────────────────────── */}
			<section>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{ACTION_CARDS.map((card) => {
						const Icon = card.icon;
						return (
							<button
								key={card.id}
								type="button"
								onClick={() => handleActionClick(card.id)}
								className="group flex flex-col items-start gap-3 p-5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all duration-300 text-left"
							>
								<div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
									<Icon className="w-5 h-5 text-violet-600" />
								</div>
								<div>
									<p className="font-semibold text-slate-900 dark:text-white text-sm">
										{card.title}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
										{card.description}
									</p>
								</div>
								<ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-violet-600 transition-colors ml-auto" />
							</button>
						);
					})}
				</div>
			</section>

			{/* ── Navigation back to home when on sub-section ────────────────── */}
			{activeSection !== 'home' && (
				<button
					type="button"
					onClick={() => setActiveSection('home')}
					className="inline-flex items-center gap-1.5 text-sm text-violet-700 dark:text-violet-400 hover:text-violet-600 font-medium transition-colors"
				>
					<ChevronRight className="w-4 h-4 rotate-180" />
					Voltar ao inicio
				</button>
			)}

			{/* ── FAQ section (inline) ───────────────────────────────────────── */}
			{activeSection === 'faq' && (
				<section className="space-y-4">
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Perguntas Frequentes
					</h2>
					{faqs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600">
							<HelpCircle className="w-12 h-12 mb-3 opacity-50" />
							<p className="text-sm font-medium">
								Nenhuma pergunta frequente cadastrada
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{faqs.map((faq) => (
								<details
									key={faq.id}
									className="group rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden"
								>
									<summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none">
										<span className="font-medium text-sm text-slate-900 dark:text-white">
											{faq.question}
										</span>
										<ChevronRight className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-90" />
									</summary>
									<div className="px-5 pb-4 text-sm text-slate-600 dark:text-gray-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
										{faq.answer}
									</div>
								</details>
							))}
						</div>
					)}
				</section>
			)}

			{/* ── Base de conhecimento section ────────────────────────────────── */}
			{activeSection === 'base' && (
				<section className="space-y-4">
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Base de Conhecimento
					</h2>
					{kbLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
						</div>
					) : knowledgeBaseArticles.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600">
							<BookOpen className="w-12 h-12 mb-3 opacity-50" />
							<p className="text-sm font-medium">Nenhum artigo encontrado</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{knowledgeBaseArticles.map((article) => {
								const Icon = article.type === 'video' ? Play : FileText;
								return (
									<div
										key={article.id}
										className="flex items-start gap-4 p-5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all cursor-pointer"
									>
										<div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
											<Icon className="w-5 h-5 text-violet-700 dark:text-violet-400" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
												{article.title}
											</p>
											<div className="flex items-center gap-3 mt-1.5">
												<span className="text-xs text-slate-500 dark:text-gray-400">
													{article.type === 'video' ? 'Video' : 'Artigo'}
												</span>
												{article.readTime != null && (
													<span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
														<Clock className="w-3 h-3" />
														{article.readTime} min
													</span>
												)}
											</div>
										</div>
										<ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0 mt-1" />
									</div>
								);
							})}
						</div>
					)}
				</section>
			)}

			{/* ── Videos section ──────────────────────────────────────────────── */}
			{activeSection === 'videos' && (
				<section className="space-y-4">
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Videos Tutoriais
					</h2>
					{kbLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{knowledgeBaseArticles
								.filter((a) => a.type === 'video')
								.map((article) => (
									<div
										key={article.id}
										className="flex items-start gap-4 p-5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all cursor-pointer"
									>
										<div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
											<Play className="w-5 h-5 text-rose-600 dark:text-rose-400" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
												{article.title}
											</p>
											{article.readTime != null && (
												<span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500 mt-1.5">
													<Clock className="w-3 h-3" />
													{article.readTime} min
												</span>
											)}
										</div>
										<ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0 mt-1" />
									</div>
								))}
							{knowledgeBaseArticles.filter((a) => a.type === 'video')
								.length === 0 && (
								<div className="col-span-2 flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-600">
									<Play className="w-10 h-10 mb-3 opacity-50" />
									<p className="text-sm font-medium">Nenhum video encontrado</p>
								</div>
							)}
						</div>
					)}
				</section>
			)}

			{/* ── 3. Meus Chamados ───────────────────────────────────────────── */}
			{activeSection === 'home' && (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
							Meus chamados
						</h2>
						{allChats.length > 0 && (
							<span className="text-xs text-slate-500 dark:text-gray-400">
								{allChats.length}{' '}
								{allChats.length === 1 ? 'chamado' : 'chamados'}
							</span>
						)}
					</div>

					{allChats.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-14 rounded-lg border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
							<MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
							<p className="text-sm font-medium text-slate-500 dark:text-gray-400">
								Nenhum chamado ainda
							</p>
							<p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
								Abra um chamado para conversar com nossos tecnicos.
							</p>
							<button
								type="button"
								onClick={() => setNewDoubtOpen(true)}
								className="mt-4 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors"
							>
								Abrir chamado
							</button>
						</div>
					) : (
						<div className="space-y-3">
							{visibleChats.map((chat, index) => (
								<div
									key={chat.id}
									className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all"
								>
									<div className="flex items-center gap-3 flex-1 min-w-0">
										<span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-400 shrink-0">
											{formatTicketNumber(chat, index)}
										</span>
										{statusBadge(chat.status)}
										<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
											{chat.categoryName ?? 'Chamado'}
										</p>
									</div>
									<div className="flex items-center gap-4 sm:gap-6 sm:shrink-0">
										<span className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{formatDate(chat.createdAt)}
										</span>
										<button
											type="button"
											onClick={() => setSelectedChatId(chat.id)}
											className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-600 transition-colors flex items-center gap-1"
										>
											Responder
											<ChevronRight className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							))}
							{hasMore && !showAllChats && (
								<button
									type="button"
									onClick={() => setShowAllChats(true)}
									className="w-full py-3 text-sm font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-600 transition-colors text-center"
								>
									Ver todos os {sortedChats.length} chamados
								</button>
							)}
						</div>
					)}
				</section>
			)}

			{/* ── 4. Base de conhecimento em destaque ─────────────────────────── */}
			{activeSection === 'home' && knowledgeBaseArticles.length > 0 && (
				<section className="space-y-4">
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Base de conhecimento em destaque
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{knowledgeBaseArticles.slice(0, 4).map((article) => {
							const Icon = article.type === 'video' ? Play : FileText;
							return (
								<div
									key={article.id}
									className="flex items-start gap-4 p-5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all cursor-pointer group"
								>
									<div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
										<Icon className="w-5 h-5 text-violet-700 dark:text-violet-400" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors truncate">
											{article.title}
										</p>
										<div className="flex items-center gap-3 mt-1.5">
											<span className="text-xs text-slate-500 dark:text-gray-400">
												{article.type === 'video' ? 'Video' : 'Artigo'}
											</span>
											{article.readTime != null && (
												<span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
													<Clock className="w-3 h-3" />
													{article.readTime} min
												</span>
											)}
										</div>
									</div>
									<ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-violet-600 shrink-0 mt-1 transition-colors" />
								</div>
							);
						})}
					</div>
				</section>
			)}

			{/* ── 5. Bottom CTA ──────────────────────────────────────────────── */}
			{activeSection === 'home' && (
				<section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-6 md:p-8 text-center">
					<Headphones className="w-10 h-10 text-violet-600 mx-auto mb-3" />
					<h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
						Ainda precisa de ajuda?
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1 mb-5">
						Nossa equipe esta disponivel para te ajudar em tempo real.
					</p>
					<button
						type="button"
						onClick={() => setNewDoubtOpen(true)}
						className="inline-flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
					>
						<MessageSquare className="w-4 h-4" />
						Abrir chat agora
					</button>
				</section>
			)}

			{/* ── 6. Widget lateral (fixed) ──────────────────────────────────── */}
			<div className="fixed bottom-6 right-6 z-30">
				<button
					type="button"
					onClick={() => setNewDoubtOpen(true)}
					className="group flex items-center gap-3 pl-5 pr-4 py-3 bg-violet-600 hover:bg-violet-400 text-white font-semibold rounded-lg shadow-xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
				>
					<div className="flex flex-col items-start">
						<span className="text-xs text-violet-200 font-normal leading-tight">
							Precisa de ajuda urgente?
						</span>
						<span className="text-sm font-bold leading-tight">Abrir chat</span>
					</div>
					<div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
						<MessageSquare className="w-5 h-5" />
					</div>
				</button>
			</div>

			{/* ── Chat modal (ticket existente) ─────────────────────────────── */}
			{selectedChatId && selectedChat && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#1a1a1d] rounded-lg shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
							<div className="flex items-center gap-3 min-w-0">
								<button
									type="button"
									onClick={() => setSelectedChatId(null)}
									className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
								>
									<ArrowLeft className="w-4 h-4 text-slate-600 dark:text-gray-400" />
								</button>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-400">
											#
											{String(selectedChat.ticketNumber ?? '').padStart(3, '0')}
										</span>
										{statusBadge(selectedChat.status)}
									</div>
									<p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
										{selectedChat.categoryName ?? 'Chamado'}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setSelectedChatId(null)}
								className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
							>
								<X className="w-4 h-4 text-slate-600 dark:text-gray-400" />
							</button>
						</div>
						{/* Chat body */}
						<div className="flex-1 overflow-y-auto p-5">
							<DoubtChatView
								chat={selectedChat}
								customerName={customerName}
								onSendMessage={handleSendChatMessage}
							/>
						</div>
					</div>
				</div>
			)}

			{/* ── NewDoubtFlow modal ─────────────────────────────────────────── */}
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
