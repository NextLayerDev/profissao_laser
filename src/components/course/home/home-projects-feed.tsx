'use client';

import { Eye, Heart, Loader2, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
	useCommunityProjects,
	useCreateProjectComment,
	useProjectComments,
	useToggleProjectLike,
} from '@/hooks/use-community';
import type { Project } from '@/types/community';
import { formatMessageTime } from '@/utils/formatDate';

export function HomeProjectsFeed() {
	const { data: projects = [], isLoading } = useCommunityProjects(1, 12, {
		sort: 'recent',
	});

	return (
		<section className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
					Feed da Comunidade
				</h2>
				<Link
					href="/course/vitrine"
					className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
				>
					Ver toda a vitrine →
				</Link>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-10">
					<Loader2 className="w-5 h-5 animate-spin text-violet-500" />
				</div>
			) : projects.length === 0 ? (
				<div className="py-10 text-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nenhum projeto na comunidade ainda. Seja o primeiro!
					</p>
					<Link
						href="/course/vitrine"
						className="inline-block mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Publicar projeto
					</Link>
				</div>
			) : (
				<div className="space-y-3">
					{projects.map((p) => (
						<FeedCard key={p.id} p={p} />
					))}
				</div>
			)}
		</section>
	);
}

function FeedCard({ p }: { p: Project }) {
	const [showComments, setShowComments] = useState(false);
	const [comment, setComment] = useState('');
	const toggleLike = useToggleProjectLike();
	const { data: comments = [], isLoading: commentsLoading } =
		useProjectComments(showComments ? p.id : null);
	const createComment = useCreateProjectComment(p.id);

	function submitComment() {
		const text = comment.trim();
		if (!text) return;
		createComment.mutate(
			{ content: text },
			{ onSuccess: () => setComment('') },
		);
	}

	return (
		<article className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-violet-300 dark:hover:border-violet-500/40 transition-colors">
			{/* Header: autor + tempo */}
			<div className="flex items-center gap-2.5 px-3 pt-3">
				<div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
					{p.author?.[0]?.toUpperCase() ?? '?'}
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
						{p.author || 'Anônimo'}
					</p>
					<p className="text-[11px] text-slate-500 dark:text-gray-400">
						{p.time || 'recentemente'}
					</p>
				</div>
			</div>

			{/* Imagem 16:9 */}
			{p.img ? (
				<Link href={`/course/vitrine?project=${p.id}`} className="block mt-2">
					<img
						src={p.img}
						alt={p.title}
						className="w-full aspect-[16/9] object-cover bg-slate-100 dark:bg-white/[0.03]"
						loading="lazy"
					/>
				</Link>
			) : null}

			{/* Conteúdo */}
			<div className="px-3 py-2.5 space-y-1.5">
				<Link href={`/course/vitrine?project=${p.id}`}>
					<h3 className="text-sm font-bold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors line-clamp-1">
						{p.title}
					</h3>
				</Link>
				{p.description ? (
					<p className="text-xs text-slate-600 dark:text-gray-300 line-clamp-1">
						{p.description}
					</p>
				) : null}
				{p.material || p.technique ? (
					<div className="flex flex-wrap gap-1.5 pt-0.5">
						{p.material ? (
							<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300">
								{p.material}
							</span>
						) : null}
						{p.technique ? (
							<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
								{p.technique}
							</span>
						) : null}
					</div>
				) : null}
			</div>

			{/* Footer: ações (curtir / comentar inline / ver) */}
			<div className="flex items-center gap-1 px-2 py-1.5 border-t border-slate-100 dark:border-white/5">
				<button
					type="button"
					onClick={() => toggleLike.mutate(p.id)}
					disabled={toggleLike.isPending}
					className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
						p.liked
							? 'text-pink-600 dark:text-pink-400'
							: 'text-slate-500 dark:text-gray-400 hover:text-pink-500'
					}`}
				>
					<Heart
						className={`w-4 h-4 ${p.liked ? 'fill-pink-500 text-pink-500' : ''}`}
					/>
					{p.likes ?? 0}
				</button>
				<button
					type="button"
					onClick={() => setShowComments((v) => !v)}
					className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
						showComments
							? 'text-violet-600 dark:text-violet-400'
							: 'text-slate-500 dark:text-gray-400 hover:text-violet-500'
					}`}
				>
					<MessageSquare className="w-4 h-4" />
					{p.comments ?? 0}
				</button>
				<Link
					href={`/course/vitrine?project=${p.id}`}
					className="ml-auto flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
				>
					<Eye className="w-3.5 h-3.5" />
					Ver
				</Link>
			</div>

			{/* Comentários inline */}
			{showComments ? (
				<div className="border-t border-slate-100 dark:border-white/5 px-3 py-3 space-y-3 bg-slate-50/70 dark:bg-white/[0.02]">
					{commentsLoading ? (
						<div className="flex justify-center py-2">
							<Loader2 className="w-4 h-4 animate-spin text-violet-500" />
						</div>
					) : comments.length === 0 ? (
						<p className="text-xs text-slate-500 dark:text-gray-400">
							Nenhum comentário ainda. Seja o primeiro!
						</p>
					) : (
						<ul className="space-y-2 max-h-52 overflow-y-auto">
							{comments.map((c) => (
								<li key={c.id} className="text-xs leading-snug">
									<span className="font-semibold text-slate-900 dark:text-white">
										{c.author}
									</span>
									{c.isAdmin ? (
										<span className="ml-1 text-violet-500">(Admin)</span>
									) : null}
									<span className="ml-2 text-[10px] text-slate-400">
										{formatMessageTime(c.time)}
									</span>
									<p className="text-slate-600 dark:text-gray-300">
										{c.content}
									</p>
								</li>
							))}
						</ul>
					)}
					<div className="flex gap-2">
						<input
							type="text"
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') submitComment();
							}}
							placeholder="Escreva um comentário..."
							className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500/50"
						/>
						<button
							type="button"
							onClick={submitComment}
							disabled={!comment.trim() || createComment.isPending}
							className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-50 flex items-center"
						>
							<Send className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>
			) : null}
		</article>
	);
}
