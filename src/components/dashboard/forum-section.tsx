'use client';

import {
	ChevronDown,
	ChevronUp,
	Loader2,
	MessageSquare,
	Send,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateForumReply,
	useForumPost,
	useForumPosts,
} from '@/hooks/use-forum';
import type { ForumPost } from '@/types/forum';

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

function PostReplyPanel({ postId }: { postId: string }) {
	const { data: post, isLoading } = useForumPost(postId);
	const [replyContent, setReplyContent] = useState('');
	const createReply = useCreateForumReply(postId);

	function handleReply(e: React.FormEvent) {
		e.preventDefault();
		if (!replyContent.trim()) return;
		createReply.mutate(replyContent.trim(), {
			onSuccess: () => {
				setReplyContent('');
				toast.success('Resposta enviada!');
			},
			onError: () => toast.error('Erro ao enviar resposta'),
		});
	}

	if (isLoading || !post) {
		return (
			<div className="flex justify-center py-4">
				<Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="mt-3 space-y-3">
			{/* Conteúdo da pergunta */}
			<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
				{post.content}
			</p>

			{/* Respostas existentes */}
			{post.replies && post.replies.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">
						{post.replies.length}{' '}
						{post.replies.length === 1 ? 'resposta' : 'respostas'}
					</p>
					{post.replies.map((reply) => (
						<div
							key={reply.id}
							className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
									{reply.author}
									{reply.isInstructor && (
										<span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-full font-medium">
											Instrutor
										</span>
									)}
								</span>
								<span className="text-xs text-slate-400 dark:text-slate-500">
									{timeAgo(reply.createdAt)}
								</span>
							</div>
							<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
								{reply.content}
							</p>
						</div>
					))}
				</div>
			)}

			{/* Form de resposta */}
			<form onSubmit={handleReply} className="space-y-2">
				<textarea
					value={replyContent}
					onChange={(e) => setReplyContent(e.target.value)}
					placeholder="Escreva sua resposta..."
					rows={3}
					className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
				/>
				<div className="flex justify-end">
					<button
						type="submit"
						disabled={createReply.isPending || !replyContent.trim()}
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl transition-colors"
					>
						{createReply.isPending ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Send className="w-3.5 h-3.5" />
						)}
						Responder
					</button>
				</div>
			</form>
		</div>
	);
}

function PostItem({ post }: { post: ForumPost }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="w-full flex items-start gap-3 p-3 text-left bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
			>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap mb-1">
						{post.categoryName && (
							<span
								className="px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0"
								style={{
									backgroundColor: `${post.categoryColor ?? '#7c3aed'}20`,
									color: post.categoryColor ?? '#7c3aed',
								}}
							>
								{post.categoryName}
							</span>
						)}
						{post.repliesCount === 0 && (
							<span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0">
								Sem resposta
							</span>
						)}
					</div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate">
						{post.title}
					</p>
					<div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
						<span>{post.author}</span>
						<span>•</span>
						<span>{timeAgo(post.createdAt)}</span>
						<span>•</span>
						<span className="flex items-center gap-1">
							<MessageSquare className="w-3 h-3" />
							{post.repliesCount}
						</span>
					</div>
				</div>
				{expanded ? (
					<ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
				) : (
					<ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
				)}
			</button>

			{expanded && (
				<div className="px-3 pb-3 bg-white dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
					<PostReplyPanel postId={post.id} />
				</div>
			)}
		</div>
	);
}

export function ForumSection() {
	const { data, isLoading } = useForumPosts({ limit: 15 });
	const posts = data?.posts ?? [];

	return (
		<div className="lg:col-span-3">
			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
				Dúvidas do Fórum
			</h3>

			<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800/50 shadow-sm dark:shadow-none overflow-hidden">
				{isLoading ? (
					<div className="flex justify-center py-10">
						<Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
					</div>
				) : posts.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
						<MessageSquare className="w-8 h-8 mb-2" />
						<p className="text-sm">Nenhuma dúvida no fórum</p>
					</div>
				) : (
					<div className="divide-y divide-slate-100 dark:divide-white/5">
						{posts.map((post) => (
							<div key={post.id} className="p-3">
								<PostItem post={post} />
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
