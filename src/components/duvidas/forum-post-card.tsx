'use client';

import { CheckCircle2, ChevronUp, MessageSquare } from 'lucide-react';
import type { ForumPost } from '@/types/forum';

interface ForumPostCardProps {
	post: ForumPost;
	onSelect: (post: ForumPost) => void;
	onUpvote: (id: string) => void;
}

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'agora';
	if (mins < 60) return `${mins}min atrás`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h atrás`;
	const days = Math.floor(hours / 24);
	return `${days}d atrás`;
}

export function ForumPostCard({
	post,
	onSelect,
	onUpvote,
}: ForumPostCardProps) {
	return (
		<div className="group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 hover:border-violet-300 dark:hover:border-violet-500/50 transition-all cursor-pointer">
			<div className="flex gap-3">
				{/* Upvote column */}
				<div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onUpvote(post.id);
						}}
						className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors text-xs font-bold ${
							post.upvotedByMe
								? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
								: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
						}`}
					>
						<ChevronUp className="w-3.5 h-3.5" />
						{post.upvotes}
					</button>
				</div>

				{/* Content */}
				<button
					type="button"
					onClick={() => onSelect(post)}
					className="flex-1 min-w-0 text-left"
				>
					<div className="flex items-start gap-2 mb-1.5 flex-wrap">
						{post.categoryName && (
							<span
								className="px-2 py-0.5 text-xs font-semibold rounded-full shrink-0"
								style={{
									backgroundColor: `${post.categoryColor ?? '#7c3aed'}20`,
									color: post.categoryColor ?? '#7c3aed',
								}}
							>
								{post.categoryName}
							</span>
						)}
						{post.acceptedReplyId && (
							<span className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full shrink-0">
								<CheckCircle2 className="w-3 h-3" />
								Resolvida
							</span>
						)}
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug mb-1">
						{post.title}
					</h3>
					<p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
						{post.content}
					</p>
				</button>

				{/* Meta */}
				<div className="flex flex-col items-end gap-2 shrink-0 text-xs text-slate-400 dark:text-slate-500">
					<span className="flex items-center gap-1">
						<MessageSquare className="w-3.5 h-3.5" />
						{post.repliesCount}
					</span>
					<span>{timeAgo(post.createdAt)}</span>
					<span className="text-right leading-tight max-w-24 truncate">
						{post.author}
					</span>
				</div>
			</div>
		</div>
	);
}
