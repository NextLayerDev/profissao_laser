'use client';

import {
	ArrowLeft,
	ChevronUp,
	Loader2,
	MessageSquare,
	Send,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ForumReplyItem } from '@/components/duvidas/forum-reply-item';
import {
	useCreateForumReply,
	useDeleteForumPost,
	useForumPost,
	useUpvoteForumPost,
} from '@/hooks/use-forum';

interface ForumPostDetailProps {
	postId: string;
	currentUserId: string;
	onBack: () => void;
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

export function ForumPostDetail({
	postId,
	currentUserId,
	onBack,
}: ForumPostDetailProps) {
	const { data: post, isLoading } = useForumPost(postId);
	const [replyContent, setReplyContent] = useState('');

	const upvote = useUpvoteForumPost();
	const createReply = useCreateForumReply(postId);
	const deletePost = useDeleteForumPost();

	function handleUpvote() {
		upvote.mutate(postId);
	}

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

	function handleDeletePost() {
		if (!confirm('Deletar esta pergunta e todas as respostas?')) return;
		deletePost.mutate(postId, {
			onSuccess: () => {
				toast.success('Pergunta removida');
				onBack();
			},
			onError: () => toast.error('Erro ao remover pergunta'),
		});
	}

	if (isLoading || !post) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
			</div>
		);
	}

	const isOwner = post.authorId === currentUserId;

	return (
		<div className="space-y-5">
			{/* Back */}
			<button
				type="button"
				onClick={onBack}
				className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Voltar ao fórum
			</button>

			{/* Post */}
			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
				<div className="flex gap-4">
					{/* Upvote */}
					<div className="flex flex-col items-center gap-1 shrink-0 pt-1">
						<button
							type="button"
							onClick={handleUpvote}
							disabled={upvote.isPending}
							className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-colors text-sm font-bold ${
								post.upvotedByMe
									? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
									: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
							}`}
						>
							<ChevronUp className="w-4 h-4" />
							{post.upvotes}
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-3 mb-3">
							<div className="flex items-center gap-2 flex-wrap">
								{post.categoryName && (
									<span
										className="px-2 py-0.5 text-xs font-semibold rounded-full"
										style={{
											backgroundColor: `${post.categoryColor ?? '#7c3aed'}20`,
											color: post.categoryColor ?? '#7c3aed',
										}}
									>
										{post.categoryName}
									</span>
								)}
							</div>
							{isOwner && (
								<button
									type="button"
									onClick={handleDeletePost}
									disabled={deletePost.isPending}
									className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
									title="Deletar pergunta"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							)}
						</div>

						<h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 leading-snug">
							{post.title}
						</h2>
						<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-4">
							{post.content}
						</p>

						<div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
							<span className="font-medium">{post.author}</span>
							<span>•</span>
							<span>{timeAgo(post.createdAt)}</span>
							<span>•</span>
							<span className="flex items-center gap-1">
								<MessageSquare className="w-3 h-3" />
								{post.repliesCount} respostas
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Replies */}
			{post.replies && post.replies.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
						{post.replies.length}{' '}
						{post.replies.length === 1 ? 'resposta' : 'respostas'}
					</h3>
					{post.replies.map((reply) => (
						<ForumReplyItem
							key={reply.id}
							reply={reply}
							postId={postId}
							currentUserId={currentUserId}
							postAuthorId={post.authorId}
							isPostAuthor={isOwner}
						/>
					))}
				</div>
			)}

			{/* Reply form */}
			<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
				<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
					Sua resposta
				</h3>
				<form onSubmit={handleReply} className="space-y-3">
					<textarea
						value={replyContent}
						onChange={(e) => setReplyContent(e.target.value)}
						placeholder="Escreva sua resposta..."
						rows={4}
						className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
					/>
					<div className="flex justify-end">
						<button
							type="submit"
							disabled={createReply.isPending || !replyContent.trim()}
							className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl transition-colors"
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
		</div>
	);
}
