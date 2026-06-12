'use client';

import { CheckCircle2, ChevronUp, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ForumListSkeleton } from '@/components/ui/skeletons/forum-skeleton';
import { useForumPosts } from '@/hooks/use-forum';
import type { ForumSort } from '@/services/forum';
import { formatMessageTime } from '@/utils/formatDate';

interface ForumRecentDiscussionsProps {
	limit?: number;
	/** Quando preenchido, filtra os posts por texto (título/conteúdo). */
	search?: string;
	/** Ordenação (recent | top | unanswered). */
	sort?: ForumSort;
	/** Filtra por tema (uuid) ou 'none' (sem tema). */
	categoryId?: string;
	/** Título da seção (default "Discussões Recentes"). */
	title?: string;
}

/**
 * Lista de discussões do fórum — usada como "Discussões Recentes" na home do
 * fórum e como lista de resultados quando há busca/filtros ativos.
 */
export function ForumRecentDiscussions({
	limit = 20,
	search,
	sort,
	categoryId,
	title = 'Discussões Recentes',
}: ForumRecentDiscussionsProps) {
	const { data: postsResponse, isLoading } = useForumPosts({
		limit,
		search: search?.trim() || undefined,
		sort: sort && sort !== 'recent' ? sort : undefined,
		categoryId: categoryId || undefined,
	});
	const posts = postsResponse?.posts ?? [];

	if (isLoading) {
		return (
			<section className="space-y-3">
				<h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
					{title}
				</h2>
				<ForumListSkeleton count={4} />
			</section>
		);
	}

	if (posts.length === 0) {
		return (
			<section className="space-y-3">
				<h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
					{title}
				</h2>
				<div className="py-10 text-center text-sm text-slate-500 dark:text-gray-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
					{search || categoryId || (sort && sort !== 'recent')
						? 'Nenhuma discussão encontrada para esses filtros.'
						: 'Ainda não tem discussões. Seja o primeiro!'}
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-3">
			<h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
				{title}
			</h2>
			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
				{/* Header de colunas */}
				<div className="hidden sm:grid grid-cols-[1fr_150px_70px_70px_130px] gap-3 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
					<span>Tópico</span>
					<span>Tema</span>
					<span className="text-center">Votos</span>
					<span className="text-center">Respostas</span>
					<span>Atividade</span>
				</div>
				<div>
					{posts.map((post) => {
						const href = post.categoryId
							? `/course/forum/${post.categoryId}/${post.id}`
							: `/course/forum/uncategorized/${post.id}`;
						const categoryColor = post.categoryColor || '#8b5cf6';
						const solved = !!post.acceptedReplyId;
						const unanswered = post.repliesCount === 0;
						return (
							<Link
								key={post.id}
								href={href}
								className="group grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_150px_70px_70px_130px] items-center gap-3 px-4 py-3 border-b last:border-b-0 border-slate-200 dark:border-white/10 border-l-2 border-l-transparent hover:border-l-violet-500 hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-all"
							>
								{/* Tópico */}
								<div className="flex items-start gap-2.5 min-w-0">
									<div
										className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
										style={{
											backgroundColor: `${categoryColor}22`,
											color: categoryColor,
										}}
									>
										{post.author?.[0]?.toUpperCase() ?? '?'}
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5 min-w-0">
											<p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
												{post.title}
											</p>
											{solved && (
												<span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
													<CheckCircle2 className="w-3 h-3" />
													Resolvido
												</span>
											)}
											{!solved && unanswered && (
												<span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0">
													Sem resposta
												</span>
											)}
										</div>
										<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
											por <span className="font-medium">{post.author}</span> ·{' '}
											{formatMessageTime(post.createdAt)}
										</p>
									</div>
								</div>

								{/* Tema badge */}
								<div className="hidden sm:block min-w-0">
									{post.categoryName ? (
										<span
											className="inline-block text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-full"
											style={{
												backgroundColor: `${categoryColor}25`,
												color: categoryColor,
											}}
										>
											{post.categoryName}
										</span>
									) : (
										<span className="text-xs text-slate-400 dark:text-gray-500 italic">
											Sem tema
										</span>
									)}
								</div>

								{/* Votos */}
								<div className="hidden sm:flex items-center justify-center gap-0.5 text-sm font-semibold text-slate-700 dark:text-gray-300">
									<ChevronUp className="w-3.5 h-3.5 text-violet-500" />
									{post.upvotes.toLocaleString('pt-BR')}
								</div>

								{/* Respostas */}
								<div className="hidden sm:flex items-center justify-center gap-1 text-sm font-semibold text-slate-700 dark:text-gray-300">
									<MessageSquare className="w-3.5 h-3.5 text-slate-400" />
									{post.repliesCount.toLocaleString('pt-BR')}
								</div>

								{/* Atividade */}
								<div className="hidden sm:block min-w-0 text-xs">
									<p className="text-slate-700 dark:text-gray-300 font-medium truncate">
										{formatMessageTime(post.updatedAt)}
									</p>
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
}
