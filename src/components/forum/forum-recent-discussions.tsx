'use client';

import { Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useForumPosts } from '@/hooks/use-forum';
import { formatMessageTime } from '@/utils/formatDate';

interface ForumRecentDiscussionsProps {
	limit?: number;
}

/**
 * Section "Discussões Recentes" no estilo LPF "What's New" — mostra os posts
 * mais recentes do fórum INDEPENDENTE de categoria. Garante que mesmo sem
 * categorias cadastradas o customer veja as conversas existentes.
 */
export function ForumRecentDiscussions({
	limit = 20,
}: ForumRecentDiscussionsProps) {
	const { data: postsResponse, isLoading } = useForumPosts({ limit });
	const posts = postsResponse?.posts ?? [];

	if (isLoading) {
		return (
			<section className="space-y-3">
				<h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
					Discussões Recentes
				</h2>
				<div className="flex items-center justify-center py-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
					<Loader2 className="w-5 h-5 animate-spin text-violet-500" />
				</div>
			</section>
		);
	}

	if (posts.length === 0) {
		return (
			<section className="space-y-3">
				<h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
					Discussões Recentes
				</h2>
				<div className="py-10 text-center text-sm text-slate-500 dark:text-gray-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
					Ainda não tem discussões. Seja o primeiro!
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-3">
			<h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
				Discussões Recentes
			</h2>
			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
				{/* Header de colunas */}
				<div className="grid grid-cols-[1fr_140px_80px_140px] gap-3 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
					<span>Tópico</span>
					<span>Categoria</span>
					<span className="text-center">Respostas</span>
					<span>Atividade</span>
				</div>
				<div>
					{posts.map((post) => {
						const href = post.categoryId
							? `/course/forum/${post.categoryId}/${post.id}`
							: `/course/forum/uncategorized/${post.id}`;
						const categoryColor = post.categoryColor || '#8b5cf6';
						return (
							<Link
								key={post.id}
								href={href}
								className="grid grid-cols-[1fr_140px_80px_140px] items-center gap-3 px-4 py-3 border-b last:border-b-0 border-slate-200 dark:border-white/10 hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
							>
								{/* Tópico */}
								<div className="flex items-start gap-2.5 min-w-0">
									<div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
										<MessageSquare className="w-3.5 h-3.5" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
											{post.title}
										</p>
										<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
											por <span className="font-medium">{post.author}</span> ·{' '}
											{formatMessageTime(post.createdAt)}
										</p>
									</div>
								</div>

								{/* Categoria badge */}
								<div className="min-w-0">
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
											Sem categoria
										</span>
									)}
								</div>

								{/* Respostas */}
								<div className="text-center">
									<p className="text-sm font-semibold text-slate-900 dark:text-white">
										{post.repliesCount.toLocaleString('pt-BR')}
									</p>
								</div>

								{/* Atividade */}
								<div className="min-w-0 text-xs">
									<p className="text-slate-700 dark:text-gray-300 font-medium truncate">
										{formatMessageTime(post.updatedAt)}
									</p>
									{post.upvotes > 0 ? (
										<p className="text-slate-500 dark:text-gray-400 truncate">
											{post.upvotes} upvotes
										</p>
									) : null}
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
}
