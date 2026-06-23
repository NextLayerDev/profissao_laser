'use client';

import { ChevronRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { useMemberAvatarMap } from '@/hooks/use-community';
import type { ForumCategory, ForumPost } from '@/types/forum';
import { formatMessageTime } from '@/utils/formatDate';

interface ForumBoardRowProps {
	category: ForumCategory;
	/** Último post da categoria (derivado no parent a partir de useForumPosts) */
	lastPost?: ForumPost | null;
}

/** Card de tema do fórum — acento na cor da categoria. */
export function ForumBoardRow({ category, lastPost }: ForumBoardRowProps) {
	const color = category.color || '#8b5cf6';
	const avatarMap = useMemberAvatarMap();

	return (
		<Link
			href={`/course/forum/${category.id}`}
			className="group relative flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all overflow-hidden"
		>
			{/* Barra de acento na cor do tema */}
			<span
				aria-hidden
				className="absolute left-0 top-0 bottom-0 w-1"
				style={{ backgroundColor: color }}
			/>

			<div className="flex items-center gap-3 min-w-0">
				<div
					className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
					style={{ backgroundColor: `${color}22`, color }}
					aria-hidden
				>
					<MessageSquare className="w-5 h-5" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
						{category.name}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400">
						{category.postsCount.toLocaleString('pt-BR')}{' '}
						{category.postsCount === 1 ? 'discussão' : 'discussões'}
					</p>
				</div>
				<ChevronRight className="w-4 h-4 text-slate-300 dark:text-gray-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0" />
			</div>

			{lastPost ? (
				<div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5 min-w-0">
					<Avatar
						src={avatarMap.get(lastPost.authorId) ?? null}
						name={lastPost.author}
						className="w-7 h-7 text-[11px]"
						rounded="rounded-full"
					/>
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
				<p className="text-xs text-slate-400 dark:text-gray-500 italic pt-3 border-t border-slate-100 dark:border-white/5">
					Sem atividade ainda — comece uma discussão!
				</p>
			)}
		</Link>
	);
}
