'use client';

import { CheckCircle2, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
	useAcceptForumReply,
	useDeleteForumReply,
	useUpvoteForumReply,
} from '@/hooks/use-forum';
import type { ForumReply } from '@/types/forum';

interface ForumReplyItemProps {
	reply: ForumReply;
	postId: string;
	currentUserId: string;
	postAuthorId: string;
	isPostAuthor: boolean;
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

export function ForumReplyItem({
	reply,
	postId,
	currentUserId,
	isPostAuthor,
}: ForumReplyItemProps) {
	const upvote = useUpvoteForumReply(postId);
	const accept = useAcceptForumReply(postId);
	const remove = useDeleteForumReply(postId);

	const isOwner = reply.authorId === currentUserId;

	function handleUpvote() {
		upvote.mutate(reply.id);
	}

	function handleAccept() {
		accept.mutate(reply.id, {
			onError: () => toast.error('Erro ao marcar resposta'),
		});
	}

	function handleDelete() {
		if (!confirm('Deletar esta resposta?')) return;
		remove.mutate(reply.id, {
			onSuccess: () => toast.success('Resposta removida'),
			onError: () => toast.error('Erro ao remover resposta'),
		});
	}

	return (
		<div
			className={`p-4 rounded-xl border transition-colors ${
				reply.isAccepted
					? 'border-emerald-400/50 bg-emerald-50 dark:bg-emerald-500/10'
					: 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5'
			}`}
		>
			<div className="flex gap-3">
				{/* Upvote */}
				<div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
					<button
						type="button"
						onClick={handleUpvote}
						disabled={upvote.isPending}
						className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors text-xs font-bold ${
							reply.upvotedByMe
								? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
								: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
						}`}
					>
						<ChevronUp className="w-3.5 h-3.5" />
						{reply.upvotes}
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-2 flex-wrap">
						<span className="text-sm font-semibold text-slate-900 dark:text-white">
							{reply.author}
						</span>
						{reply.isInstructor && (
							<span className="px-1.5 py-0.5 text-xs font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-md">
								Instrutor
							</span>
						)}
						{reply.isAccepted && (
							<span className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md">
								<CheckCircle2 className="w-3 h-3" />
								Aceita
							</span>
						)}
						<span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
							{timeAgo(reply.createdAt)}
						</span>
					</div>
					<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
						{reply.content}
					</p>
				</div>

				{/* Actions */}
				<div className="flex flex-col items-end gap-2 shrink-0">
					{isPostAuthor && !reply.isAccepted && (
						<button
							type="button"
							onClick={handleAccept}
							disabled={accept.isPending}
							title="Marcar como resposta aceita"
							className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
						>
							<CheckCircle2 className="w-4 h-4" />
						</button>
					)}
					{isOwner && (
						<button
							type="button"
							onClick={handleDelete}
							disabled={remove.isPending}
							title="Deletar resposta"
							className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
