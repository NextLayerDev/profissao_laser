'use client';

import {
	ArrowLeft,
	BookOpen,
	CalendarClock,
	CalendarPlus,
	ChevronRight,
	Clock,
	FileText,
	Headphones,
	HelpCircle,
	Loader2,
	MessageSquare,
	Play,
	Trash2,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AppointmentForm } from '@/components/agendamentos/appointment-form';
import { DoubtChatView } from '@/components/duvidas/doubt-chat-view';
import { NewDoubtFlow } from '@/components/duvidas/new-doubt-flow';
import { SupportChatWidget } from '@/components/suporte/support-chat-widget';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { ModalPortal } from '@/components/ui/modal-portal';
import { PageHeader } from '@/components/ui/page-header';
import {
	useAppointments,
	useCancelMyAppointment,
} from '@/hooks/use-appointments';
import {
	useDoubtChat,
	useDoubtChatStats,
	useDoubtChats,
	useSendDoubtMessage,
} from '@/hooks/use-doubt-chat';
import { useFAQs } from '@/hooks/use-faq';
import { useKnowledgeBase } from '@/hooks/use-knowledge-base';
import { useSupportChat } from '@/hooks/use-support-chat';
import { type DoubtChat, isDoubtPending } from '@/types/doubt-chat';
import type { KnowledgeBaseArticle } from '@/types/knowledge-base';
import { getEmbedUrl, getVideoType } from '@/utils/video';

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

/* ─── Video Player (inline) ──────────────────────────────────────────────── */

function VideoPlayer({
	article,
	onClose,
}: {
	article: KnowledgeBaseArticle;
	onClose: () => void;
}) {
	const videoUrl = article.videoUrl ?? '';
	const vType = getVideoType(videoUrl);
	const embedUrl = getEmbedUrl(videoUrl);

	return (
		<ModalPortal>
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
				<div className="relative w-full max-w-4xl">
					{/* Close */}
					<button
						type="button"
						onClick={onClose}
						className="absolute -top-10 right-0 p-1.5 rounded-lg text-white/70 hover:text-white transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
					{/* Title */}
					<p className="text-white font-semibold mb-3 truncate">
						{article.title}
					</p>
					{/* Player */}
					<div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video">
						{(vType === 'youtube' || vType === 'vimeo' || vType === 'bunny') &&
						embedUrl ? (
							<iframe
								src={embedUrl}
								className="absolute inset-0 w-full h-full"
								allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
								allowFullScreen
								title={article.title}
							/>
						) : (
							<video
								src={videoUrl}
								controls
								autoPlay
								className="absolute inset-0 w-full h-full object-contain"
							>
								<track kind="captions" />
							</video>
						)}
					</div>
					{/* Description below video */}
					{article.content && (
						<div className="mt-4 p-4 bg-white/10 rounded-lg max-h-32 overflow-y-auto">
							<p className="text-sm text-white/80 whitespace-pre-wrap">
								{article.content}
							</p>
						</div>
					)}
				</div>
			</div>
		</ModalPortal>
	);
}

/* ─── Article Reader (modal) ─────────────────────────────────────────────── */

function ArticleReader({
	article,
	onClose,
}: {
	article: KnowledgeBaseArticle;
	onClose: () => void;
}) {
	return (
		<ModalPortal>
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
				<div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#1a1a1d] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 shrink-0">
						<div className="flex items-center gap-3 min-w-0">
							<div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
								<FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
							</div>
							<div className="min-w-0">
								<p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
									{article.title}
								</p>
								<div className="flex items-center gap-2 mt-0.5">
									{article.category && (
										<span className="text-xs text-slate-500 dark:text-gray-400">
											{article.category}
										</span>
									)}
									{article.readTime != null && (
										<span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
											<Clock className="w-3 h-3" />
											{article.readTime} min
										</span>
									)}
								</div>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
						>
							<X className="w-4 h-4 text-slate-600 dark:text-gray-400" />
						</button>
					</div>
					{/* Body */}
					<div className="flex-1 overflow-y-auto p-5 space-y-4">
						{article.excerpt && (
							<p className="text-sm text-slate-600 dark:text-gray-400 italic border-l-2 border-violet-500 pl-3">
								{article.excerpt}
							</p>
						)}
						{article.content ? (
							<div className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
								{article.content}
							</div>
						) : (
							<p className="text-sm text-slate-500 dark:text-gray-400 text-center py-8">
								Conteudo ainda nao disponivel.
							</p>
						)}
					</div>
				</div>
			</div>
		</ModalPortal>
	);
}

/* ─── Props ───────────────────────────────────────────────────────────────── */

/* ─── Agendamento (modal: criar + Meus agendamentos) ──────────────────────── */

function SchedulingModal({ onClose }: { onClose: () => void }) {
	const { appointments = [], isLoading } = useAppointments();
	const cancelMutation = useCancelMyAppointment();

	const sorted = useMemo(
		() =>
			[...(appointments ?? [])].sort(
				(a, b) =>
					new Date(`${b.date}T${b.time || '00:00'}`).getTime() -
					new Date(`${a.date}T${a.time || '00:00'}`).getTime(),
			),
		[appointments],
	);

	return (
		<ModalOverlay onClose={onClose} widthClassName="max-w-5xl">
			<div className="p-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
							<CalendarClock className="w-5 h-5 text-violet-500" />
						</div>
						<h3 className="text-lg font-bold text-slate-900 dark:text-white">
							Agendar atendimento
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
					<AppointmentForm onSuccess={onClose} />

					<div>
						<h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
							<CalendarPlus className="w-4 h-4 text-violet-500" />
							Meus agendamentos
						</h4>
						{isLoading ? (
							<div className="flex justify-center py-6">
								<Loader2 className="w-5 h-5 animate-spin text-violet-500" />
							</div>
						) : sorted.length === 0 ? (
							<p className="text-sm text-slate-500 dark:text-gray-400 py-2">
								Voce ainda nao tem agendamentos.
							</p>
						) : (
							<ul className="space-y-2">
								{sorted.map((a) => {
									const canCancel =
										a.status === 'pendente' || a.status === 'confirmado';
									return (
										<li
											key={a.id}
											className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
										>
											<div className="min-w-0">
												<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
													{a.service}
												</p>
												<p className="text-xs text-slate-500 dark:text-gray-400">
													{formatDate(a.date)} as {a.time} ·{' '}
													<span className="capitalize">{a.status}</span>
												</p>
											</div>
											{canCancel && (
												<button
													type="button"
													onClick={() => cancelMutation.mutate(a.id)}
													disabled={cancelMutation.isPending}
													className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 shrink-0"
												>
													<Trash2 className="w-3.5 h-3.5" />
													Cancelar
												</button>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>
			</div>
		</ModalOverlay>
	);
}

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
	const [supportChatOpen, setSupportChatOpen] = useState(false);
	const [supportChatId, setSupportChatId] = useState<string | null>(null);
	const [supportChatSeen, setSupportChatSeen] = useState(0);
	const [schedulingOpen, setSchedulingOpen] = useState(false);
	const sectionRef = useRef<HTMLDivElement>(null);

	// Mantém o chat em polling mesmo fechado, pra avisar de novas mensagens
	// (IA/atendente) com um badge no botão flutuante.
	const { data: supportChat } = useSupportChat(supportChatId, !!supportChatId);
	const supportMsgCount = supportChat?.messages.length ?? 0;
	const supportUnread =
		!supportChatOpen && supportChat
			? Math.max(0, supportMsgCount - supportChatSeen)
			: 0;
	const [activeSection, setActiveSection] = useState<
		'home' | 'faq' | 'base' | 'videos'
	>('home');
	const [showAllChats, setShowAllChats] = useState(false);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [playingVideo, setPlayingVideo] = useState<KnowledgeBaseArticle | null>(
		null,
	);
	const [readingArticle, setReadingArticle] =
		useState<KnowledgeBaseArticle | null>(null);

	const { data: allChats = [] } = useDoubtChats('all', hasAccess);
	const { data: selectedChat } = useDoubtChat(selectedChatId, !!selectedChatId);
	const sendMsgMutation = useSendDoubtMessage(selectedChatId);
	const { data: faqs = [] } = useFAQs(hasAccess);
	const { data: stats } = useDoubtChatStats(hasAccess);
	const { data: knowledgeBaseArticles = [], isLoading: kbLoading } =
		useKnowledgeBase(undefined, hasAccess);

	const articles = useMemo(
		() => knowledgeBaseArticles.filter((a) => a.type === 'article'),
		[knowledgeBaseArticles],
	);

	const videos = useMemo(
		() => knowledgeBaseArticles.filter((a) => a.type === 'video'),
		[knowledgeBaseArticles],
	);

	const sortedChats = useMemo(() => {
		return [...allChats].sort((a, b) => {
			// Pendentes (não respondidos) primeiro, depois por data desc.
			const ap = isDoubtPending(a) ? 0 : 1;
			const bp = isDoubtPending(b) ? 0 : 1;
			if (ap !== bp) return ap - bp;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [allChats]);

	const VISIBLE_LIMIT = 5;
	const visibleChats = showAllChats
		? sortedChats
		: sortedChats.slice(0, VISIBLE_LIMIT);
	const hasMore = sortedChats.length > VISIBLE_LIMIT;

	// Ao navegar pra uma sub-seção (FAQ / Base / Vídeos), traz o conteúdo pro
	// topo da área visível — o scroll acontece no <main> do course shell.
	useEffect(() => {
		if (activeSection === 'home') return;
		const id = window.setTimeout(() => {
			sectionRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}, 60);
		return () => window.clearTimeout(id);
	}, [activeSection]);

	// Enquanto o chat está aberto, marca tudo como visto (zera o badge).
	useEffect(() => {
		if (supportChatOpen) setSupportChatSeen(supportMsgCount);
	}, [supportChatOpen, supportMsgCount]);

	// Toast quando o atendente responde com o widget fechado (o badge no botão
	// flutuante já existe — isso garante que o cliente perceba na hora).
	const lastSupportMsg = supportChat?.messages[supportChat.messages.length - 1];
	const notifiedMsgId = useRef<string | null>(null);
	useEffect(() => {
		if (
			!supportChatOpen &&
			supportUnread > 0 &&
			lastSupportMsg &&
			(lastSupportMsg.role === 'attendant' ||
				lastSupportMsg.role === 'system') &&
			notifiedMsgId.current !== lastSupportMsg.id
		) {
			toast.info('O atendente respondeu no chat de suporte');
			notifiedMsgId.current = lastSupportMsg.id;
		}
	}, [supportChatOpen, supportUnread, lastSupportMsg]);

	function handleChatCreated(_chat: DoubtChat) {
		setNewDoubtOpen(false);
	}

	function handleSendChatMessage(content: string, file?: File) {
		sendMsgMutation.mutate({ content, file });
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

	function handleArticleClick(article: KnowledgeBaseArticle) {
		if (article.type === 'video' && article.videoUrl) {
			setPlayingVideo(article);
		} else {
			setReadingArticle(article);
		}
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
				<section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

			{/* ── CTAs principais: abrir chamado + agendar ───────────────────── */}
			{activeSection === 'home' && (
				<section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<button
						type="button"
						onClick={() => setNewDoubtOpen(true)}
						className="group flex items-center gap-4 p-6 rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-600 text-white text-left transition-all hover:shadow-xl hover:shadow-violet-500/30"
					>
						<div className="w-14 h-14 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center">
							<MessageSquare className="w-7 h-7" />
						</div>
						<div className="min-w-0">
							<p className="font-display text-lg font-bold">Abrir chamado</p>
							<p className="text-sm text-white/80">
								Envie sua duvida e acompanhe a resposta dos tecnicos
							</p>
						</div>
						<ChevronRight className="w-5 h-5 ml-auto shrink-0 opacity-80 group-hover:translate-x-0.5 transition-transform" />
					</button>
					<button
						type="button"
						onClick={() => setSchedulingOpen(true)}
						className="group flex items-center gap-4 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-left transition-all hover:border-violet-500/40 hover:shadow-lg"
					>
						<div className="w-14 h-14 shrink-0 rounded-2xl bg-violet-500/10 flex items-center justify-center">
							<CalendarClock className="w-7 h-7 text-violet-600" />
						</div>
						<div className="min-w-0">
							<p className="font-display text-lg font-bold text-slate-900 dark:text-white">
								Agendar atendimento
							</p>
							<p className="text-sm text-slate-500 dark:text-gray-400">
								Marque um horario com um dos nossos tecnicos
							</p>
						</div>
						<ChevronRight className="w-5 h-5 ml-auto shrink-0 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
					</button>
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

			{/* Âncora de scroll: ao abrir uma sub-seção, rola até aqui */}
			<div ref={sectionRef} className="scroll-mt-20" />

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

			{/* ── Base de conhecimento section (articles only) ────────────────── */}
			{activeSection === 'base' && (
				<section className="space-y-4">
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Base de Conhecimento
					</h2>
					{kbLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
						</div>
					) : articles.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600">
							<BookOpen className="w-12 h-12 mb-3 opacity-50" />
							<p className="text-sm font-medium">Nenhum artigo encontrado</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{articles.map((article) => (
								<button
									key={article.id}
									type="button"
									onClick={() => handleArticleClick(article)}
									className="flex items-start gap-4 p-5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all cursor-pointer text-left"
								>
									<div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
										<FileText className="w-5 h-5 text-violet-700 dark:text-violet-400" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
											{article.title}
										</p>
										{article.excerpt && (
											<p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">
												{article.excerpt}
											</p>
										)}
										<div className="flex items-center gap-3 mt-1.5">
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Artigo
											</span>
											{article.readTime != null && (
												<span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
													<Clock className="w-3 h-3" />
													{article.readTime} min
												</span>
											)}
											{article.category && (
												<span className="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded">
													{article.category}
												</span>
											)}
										</div>
									</div>
									<ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0 mt-1" />
								</button>
							))}
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
					) : videos.length === 0 ? (
						<div className="col-span-2 flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-600">
							<Play className="w-10 h-10 mb-3 opacity-50" />
							<p className="text-sm font-medium">Nenhum video encontrado</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{videos.map((article) => {
								const vType = article.videoUrl
									? getVideoType(article.videoUrl)
									: null;
								const thumbnailUrl =
									vType === 'youtube' && article.videoUrl
										? (() => {
												const match = article.videoUrl.match(
													/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
												);
												return match
													? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
													: null;
											})()
										: null;

								return (
									<button
										key={article.id}
										type="button"
										onClick={() =>
											article.videoUrl ? setPlayingVideo(article) : undefined
										}
										className="group flex flex-col rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all cursor-pointer text-left overflow-hidden"
									>
										{/* Thumbnail / Play overlay */}
										<div className="relative aspect-video bg-slate-100 dark:bg-black/30 flex items-center justify-center">
											{thumbnailUrl ? (
												<img
													src={thumbnailUrl}
													alt={article.title}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center">
													<Play className="w-10 h-10 text-violet-500/60 dark:text-violet-400/60" />
												</div>
											)}
											{/* Play button overlay */}
											<div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
												<div className="w-14 h-14 rounded-full bg-violet-600/90 group-hover:bg-violet-600 flex items-center justify-center shadow-xl transition-all group-hover:scale-110">
													<Play className="w-6 h-6 text-white ml-0.5" />
												</div>
											</div>
										</div>
										{/* Info */}
										<div className="p-4">
											<p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">
												{article.title}
											</p>
											{article.excerpt && (
												<p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-1">
													{article.excerpt}
												</p>
											)}
											<div className="flex items-center gap-2 mt-2">
												{article.readTime != null && (
													<span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
														<Clock className="w-3 h-3" />
														{article.readTime} min
													</span>
												)}
												{article.category && (
													<span className="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded">
														{article.category}
													</span>
												)}
											</div>
										</div>
									</button>
								);
							})}
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
											Ver chamado
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
								<button
									key={article.id}
									type="button"
									onClick={() => handleArticleClick(article)}
									className="flex items-start gap-4 p-5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30 transition-all cursor-pointer group text-left"
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
									{article.type === 'video' ? (
										<Play className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0 mt-1" />
									) : (
										<ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-violet-600 shrink-0 mt-1 transition-colors" />
									)}
								</button>
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
						onClick={() => setSupportChatOpen(true)}
						className="inline-flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
					>
						<MessageSquare className="w-4 h-4" />
						Abrir chat agora
					</button>
				</section>
			)}

			{/* ── 6. Widget lateral (fixo no viewport via portal) ─────────────── */}
			<ModalPortal>
				<div className="fixed bottom-6 right-6 z-40">
					<button
						type="button"
						onClick={() => setSupportChatOpen(true)}
						className="group relative flex items-center gap-3 pl-5 pr-4 py-3 bg-violet-600 hover:bg-violet-400 text-white font-semibold rounded-lg shadow-xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
					>
						{supportUnread > 0 && (
							<span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-[#0d0d0f] animate-pulse">
								{supportUnread > 9 ? '9+' : supportUnread}
							</span>
						)}
						<div className="flex flex-col items-start">
							<span className="text-xs text-violet-200 font-normal leading-tight">
								{supportUnread > 0
									? 'Nova mensagem no suporte'
									: 'Precisa de ajuda urgente?'}
							</span>
							<span className="text-sm font-bold leading-tight">
								{supportUnread > 0 ? 'Ver atendimento' : 'Abrir chat'}
							</span>
						</div>
						<div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
							<MessageSquare className="w-5 h-5" />
						</div>
					</button>
				</div>
			</ModalPortal>

			{/* ── Chat modal (ticket existente) ─────────────────────────────── */}
			{selectedChatId && selectedChat && (
				<ModalPortal>
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
												{String(selectedChat.ticketNumber ?? '').padStart(
													3,
													'0',
												)}
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
									onSendMessage={
										isDoubtPending(selectedChat)
											? handleSendChatMessage
											: undefined
									}
								/>
							</div>
						</div>
					</div>
				</ModalPortal>
			)}

			{/* ── NewDoubtFlow modal ─────────────────────────────────────────── */}
			<NewDoubtFlow
				isOpen={newDoubtOpen}
				onClose={() => setNewDoubtOpen(false)}
				customerId={customerId}
				customerName={customerName}
				onChatCreated={handleChatCreated}
			/>

			{/* ── Chat de suporte ao vivo (IA + atendente) ───────────────────── */}
			<SupportChatWidget
				isOpen={supportChatOpen}
				onClose={() => setSupportChatOpen(false)}
				chatId={supportChatId}
				onChatId={setSupportChatId}
			/>

			{/* ── Agendamento de atendimento ─────────────────────────────────── */}
			{schedulingOpen && (
				<SchedulingModal onClose={() => setSchedulingOpen(false)} />
			)}

			{/* ── Video player modal ─────────────────────────────────────────── */}
			{playingVideo?.videoUrl && (
				<VideoPlayer
					article={playingVideo}
					onClose={() => setPlayingVideo(null)}
				/>
			)}

			{/* ── Article reader modal ───────────────────────────────────────── */}
			{readingArticle && (
				<ArticleReader
					article={readingArticle}
					onClose={() => setReadingArticle(null)}
				/>
			)}
		</div>
	);
}
