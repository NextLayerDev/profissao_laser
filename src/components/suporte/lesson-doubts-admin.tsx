'use client';

import { useQuery } from '@tanstack/react-query';
import {
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	GraduationCap,
	Loader2,
	Reply,
	Send,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { useMemberAvatarMap } from '@/hooks/use-community';
import {
	useAdminLessonDoubts,
	useLessonsIndexMap,
	useReplyToLessonDoubt,
} from '@/hooks/use-lesson-doubts-admin';
import { getLessonDoubts } from '@/services/doubts';
import type { AdminLessonDoubt, AdminLessonDoubtsStatus } from '@/types/doubts';

const PAGE_SIZE = 30;

const FILTERS: { key: AdminLessonDoubtsStatus; label: string }[] = [
	{ key: 'unanswered', label: 'Sem resposta' },
	{ key: 'answered', label: 'Respondidas' },
	{ key: 'all', label: 'Todas' },
];

function timeAgo(iso: string): string {
	const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
	if (mins < 1) return 'agora';
	if (mins < 60) return `há ${mins}min`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `há ${hours}h`;
	return `há ${Math.floor(hours / 24)}d`;
}

/** Respostas existentes da dúvida — buscadas só quando o card é expandido. */
function DoubtReplies({ doubt }: { doubt: AdminLessonDoubt }) {
	const { data: lessonDoubts, isLoading } = useQuery({
		queryKey: ['doubts', 'lesson', doubt.lessonId],
		queryFn: () => getLessonDoubts(doubt.lessonId),
	});

	if (doubt.repliesCount === 0 && !lessonDoubts) return null;
	if (isLoading) {
		return (
			<div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500 py-2">
				<Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando respostas...
			</div>
		);
	}

	const replies = lessonDoubts?.find((d) => d.id === doubt.id)?.replies ?? [];
	if (replies.length === 0) return null;

	return (
		<div className="space-y-2 mt-3">
			{replies.map((r) => (
				<div
					key={r.id}
					className="rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/15 px-3 py-2"
				>
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
							{r.authorName}
						</span>
						<span className="text-[11px] text-slate-400 dark:text-gray-500">
							{timeAgo(r.createdAt)}
						</span>
					</div>
					<p className="text-sm text-slate-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap break-words">
						{r.content}
					</p>
				</div>
			))}
		</div>
	);
}

/**
 * Dúvidas de aulas (staff): visão agregada de todas as dúvidas dos cursos em
 * uma chamada, com contexto curso › módulo › aula e resposta inline.
 */
export function LessonDoubtsAdmin() {
	const [status, setStatus] = useState<AdminLessonDoubtsStatus>('unanswered');
	const [page, setPage] = useState(1);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [reply, setReply] = useState('');

	const { data, isLoading } = useAdminLessonDoubts({
		status,
		page,
		limit: PAGE_SIZE,
	});
	const { map: lessonMap, isSuccess: indexReady } = useLessonsIndexMap();
	const avatarMap = useMemberAvatarMap();
	const replyMut = useReplyToLessonDoubt();

	const doubts = data?.doubts ?? [];
	const total = data?.total ?? 0;
	const unansweredCount = data?.unansweredCount ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	function selectFilter(key: AdminLessonDoubtsStatus) {
		setStatus(key);
		setPage(1);
		setExpandedId(null);
	}

	function toggleExpand(id: string) {
		setExpandedId((cur) => (cur === id ? null : id));
		setReply('');
	}

	function sendReply(doubtId: string) {
		const content = reply.trim();
		if (!content || replyMut.isPending) return;
		replyMut.mutate(
			{ doubtId, content },
			{
				onSuccess: () => {
					setReply('');
					toast.success('Resposta enviada ao aluno.');
				},
				onError: () => toast.error('Erro ao enviar a resposta.'),
			},
		);
	}

	function contextLine(d: AdminLessonDoubt): string {
		// Índice ainda carregando (ou indisponível): não acusar aula inexistente.
		if (!indexReady) return 'Carregando contexto da aula…';
		const entry = lessonMap.get(d.lessonId);
		if (!entry) return 'Aula removida do catálogo';
		return `${entry.course.title} › ${entry.module.title} › ${entry.title}`;
	}

	return (
		<div className="space-y-4">
			{/* Filtros + resumo */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-1.5">
					{FILTERS.map((f) => (
						<button
							key={f.key}
							type="button"
							onClick={() => selectFilter(f.key)}
							className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
								status === f.key
									? 'bg-violet-600 text-white'
									: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
							}`}
						>
							{f.label}
							{f.key === 'unanswered' && unansweredCount > 0 && (
								<span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
									{unansweredCount > 99 ? '99+' : unansweredCount}
								</span>
							)}
						</button>
					))}
				</div>
				<p className="text-xs text-slate-500 dark:text-gray-400">
					{total} {total === 1 ? 'dúvida' : 'dúvidas'}
				</p>
			</div>

			{/* Lista */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
				</div>
			) : doubts.length === 0 ? (
				<div className="flex flex-col items-center py-14 text-slate-400 dark:text-gray-600">
					<CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/70" />
					<p className="text-sm">
						{status === 'unanswered'
							? 'Nenhuma dúvida aguardando resposta.'
							: 'Nenhuma dúvida por aqui.'}
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{doubts.map((d) => {
						const expanded = expandedId === d.id;
						return (
							<div
								key={d.id}
								className={`rounded-xl border bg-white dark:bg-[#1a1a1d] overflow-hidden transition-colors ${
									!d.answered
										? 'border-red-200 dark:border-red-500/25'
										: 'border-slate-200 dark:border-white/10'
								}`}
							>
								<button
									type="button"
									onClick={() => toggleExpand(d.id)}
									className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
								>
									<div className="flex items-start gap-3">
										<Avatar
											src={
												d.customerId
													? (avatarMap.get(d.customerId) ?? null)
													: null
											}
											name={d.authorName}
											className="w-9 h-9 text-xs"
											rounded="rounded-xl"
										/>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
													{d.authorName}
												</span>
												<span className="flex items-center gap-1.5 shrink-0">
													{!d.answered ? (
														<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 whitespace-nowrap">
															<Reply className="w-3 h-3" />
															Responder
														</span>
													) : (
														<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 whitespace-nowrap">
															{d.repliesCount}{' '}
															{d.repliesCount === 1 ? 'resposta' : 'respostas'}
														</span>
													)}
													<span className="text-[11px] text-slate-400 dark:text-gray-500 whitespace-nowrap">
														{timeAgo(d.createdAt)}
													</span>
												</span>
											</div>
											<p className="flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 mt-0.5 truncate">
												<GraduationCap className="w-3 h-3 shrink-0" />
												{contextLine(d)}
											</p>
											<p
												className={`text-sm text-slate-600 dark:text-gray-300 mt-1 break-words ${
													expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
												}`}
											>
												{d.content}
											</p>
										</div>
										<ChevronDown
											className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${
												expanded ? 'rotate-180' : ''
											}`}
										/>
									</div>
								</button>

								{expanded && (
									<div className="px-4 pb-4 pl-16">
										<DoubtReplies doubt={d} />
										<div className="flex items-end gap-2 mt-3">
											<textarea
												value={reply}
												onChange={(e) => setReply(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === 'Enter' && !e.shiftKey) {
														e.preventDefault();
														sendReply(d.id);
													}
												}}
												placeholder="Responder ao aluno..."
												rows={2}
												className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none text-sm resize-none"
											/>
											<button
												type="button"
												onClick={() => sendReply(d.id)}
												disabled={!reply.trim() || replyMut.isPending}
												className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
												aria-label="Enviar resposta"
											>
												{replyMut.isPending ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Send className="w-4 h-4" />
												)}
											</button>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Paginação */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-3">
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1}
						className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
					>
						<ChevronLeft className="w-3.5 h-3.5" /> Anterior
					</button>
					<span className="text-xs text-slate-500 dark:text-gray-400">
						{page} / {totalPages}
					</span>
					<button
						type="button"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages}
						className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
					>
						Próxima <ChevronRight className="w-3.5 h-3.5" />
					</button>
				</div>
			)}
		</div>
	);
}
