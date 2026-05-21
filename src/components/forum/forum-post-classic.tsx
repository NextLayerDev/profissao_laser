'use client';

import { CheckCircle2, ChevronUp, GraduationCap } from 'lucide-react';
import type { ForumPost, ForumReply } from '@/types/forum';
import { formatMessageTime } from '@/utils/formatDate';

interface ForumPostClassicProps {
	post: ForumPost | ForumReply;
	postNumber: number;
	/** True = é o post inicial (OP) da thread, false = uma reply. */
	isOp: boolean;
	onUpvote?: () => void;
}

export function ForumPostClassic({
	post,
	postNumber,
	isOp,
	onUpvote,
}: ForumPostClassicProps) {
	const isInstructor =
		'isInstructor' in post ? Boolean(post.isInstructor) : false;
	const isAccepted = 'isAccepted' in post ? Boolean(post.isAccepted) : false;

	return (
		<article
			className={`bg-white dark:bg-white/5 border rounded-xl overflow-hidden ${
				isAccepted
					? 'border-emerald-300 dark:border-emerald-500/40'
					: 'border-slate-200 dark:border-white/10'
			}`}
		>
			<div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
				{/* Sidebar do autor */}
				<aside className="bg-slate-50 dark:bg-white/[0.03] border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 p-4 flex md:flex-col items-center md:items-start gap-3">
					<div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
						{post.author?.[0]?.toUpperCase() ?? '?'}
					</div>
					<div className="min-w-0">
						<p className="text-sm font-bold text-slate-900 dark:text-white truncate">
							{post.author || 'Anônimo'}
						</p>
						{isInstructor ? (
							<span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
								<GraduationCap className="w-3 h-3" />
								Instrutor
							</span>
						) : (
							<p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">
								Membro
							</p>
						)}
					</div>
				</aside>

				{/* Conteúdo */}
				<div className="flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
						<p className="text-xs text-slate-500 dark:text-gray-400">
							{formatMessageTime(post.createdAt)}
						</p>
						<p className="text-xs text-slate-400 dark:text-gray-500 font-mono">
							#{postNumber}
						</p>
					</div>

					{/* Body */}
					<div className="p-4 flex-1">
						{isOp && 'title' in post ? (
							<h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
								{post.title}
							</h2>
						) : null}
						<div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-gray-200 whitespace-pre-wrap">
							{post.content}
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
						<button
							type="button"
							onClick={onUpvote}
							className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-colors ${
								'upvotedByMe' in post && post.upvotedByMe
									? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
									: 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
							}`}
						>
							<ChevronUp className="w-3.5 h-3.5" />
							<span className="font-semibold">{post.upvotes}</span>
						</button>
						{isAccepted ? (
							<span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
								<CheckCircle2 className="w-3.5 h-3.5" />
								Resposta aceita
							</span>
						) : null}
					</div>
				</div>
			</div>
		</article>
	);
}
