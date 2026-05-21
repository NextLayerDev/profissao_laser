'use client';

import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import type { ForumCategory, ForumPost } from '@/types/forum';
import { formatMessageTime } from '@/utils/formatDate';

interface ForumBoardRowProps {
	category: ForumCategory;
	/** Último post da categoria (derivado no parent a partir de useForumPosts) */
	lastPost?: ForumPost | null;
}

export function ForumBoardRow({ category, lastPost }: ForumBoardRowProps) {
	const color = category.color || '#8b5cf6';

	return (
		<Link
			href={`/course/forum/${category.id}`}
			className="grid grid-cols-[1fr_80px_240px] items-center gap-4 px-4 py-3 border-b border-slate-200 dark:border-white/10 hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
		>
			{/* Coluna 1 — Nome */}
			<div className="flex items-center gap-3 min-w-0">
				<div
					className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
					style={{ backgroundColor: `${color}25`, color }}
					aria-hidden
				>
					<MessageSquare className="w-5 h-5" />
				</div>
				<div className="min-w-0">
					<p className="font-semibold text-slate-900 dark:text-white truncate">
						{category.name}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400">
						Discussão da comunidade
					</p>
				</div>
			</div>

			{/* Coluna 2 — Posts */}
			<div className="text-center">
				<p className="text-sm font-semibold text-slate-900 dark:text-white">
					{category.postsCount.toLocaleString('pt-BR')}
				</p>
				<p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider">
					Posts
				</p>
			</div>

			{/* Coluna 3 — Última atividade */}
			<div className="min-w-0">
				{lastPost ? (
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
							{lastPost.author?.[0]?.toUpperCase() ?? '?'}
						</div>
						<div className="min-w-0">
							<p className="text-xs font-medium text-slate-700 dark:text-gray-200 truncate">
								{lastPost.title}
							</p>
							<p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">
								por {lastPost.author} · {formatMessageTime(lastPost.updatedAt)}
							</p>
						</div>
					</div>
				) : (
					<p className="text-xs text-slate-400 dark:text-gray-500 italic">
						Sem atividade ainda
					</p>
				)}
			</div>
		</Link>
	);
}
