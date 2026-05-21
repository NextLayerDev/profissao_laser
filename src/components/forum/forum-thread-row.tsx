'use client';

import { MessageSquare, Pin } from 'lucide-react';
import Link from 'next/link';
import type { ForumPost } from '@/types/forum';
import { formatMessageTime } from '@/utils/formatDate';

interface ForumThreadRowProps {
	post: ForumPost;
	categoryId: string;
}

export function ForumThreadRow({ post, categoryId }: ForumThreadRowProps) {
	const isAccepted = !!post.acceptedReplyId;

	return (
		<Link
			href={`/course/forum/${categoryId}/${post.id}`}
			className="grid grid-cols-[1fr_80px_240px] items-center gap-4 px-4 py-3 border-b border-slate-200 dark:border-white/10 hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
		>
			{/* Coluna 1 — Título + autor */}
			<div className="flex items-start gap-3 min-w-0">
				<div
					className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
						isAccepted
							? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
							: 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-gray-400'
					}`}
					aria-hidden
				>
					{isAccepted ? (
						<Pin className="w-4 h-4" />
					) : (
						<MessageSquare className="w-4 h-4" />
					)}
				</div>
				<div className="min-w-0">
					<p className="font-semibold text-slate-900 dark:text-white truncate">
						{post.title}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
						por <span className="font-medium">{post.author}</span> ·{' '}
						{formatMessageTime(post.createdAt)}
					</p>
				</div>
			</div>

			{/* Coluna 2 — Respostas */}
			<div className="text-center">
				<p className="text-sm font-semibold text-slate-900 dark:text-white">
					{post.repliesCount.toLocaleString('pt-BR')}
				</p>
				<p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider">
					Respostas
				</p>
			</div>

			{/* Coluna 3 — Última atividade */}
			<div className="min-w-0 text-xs">
				<p className="text-slate-700 dark:text-gray-300 font-medium truncate">
					{formatMessageTime(post.updatedAt)}
				</p>
				<p className="text-slate-500 dark:text-gray-400 truncate">
					{post.upvotes > 0 ? `${post.upvotes} upvotes` : 'Sem upvotes ainda'}
				</p>
			</div>
		</Link>
	);
}
