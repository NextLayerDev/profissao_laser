'use client';

import { CheckCircle2, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	useAcceptForumReply,
	useDeleteForumReply,
	useUpdateForumReply,
	useUpvoteForumReply,
} from '@/hooks/use-forum';
import { isAdmin } from '@/lib/auth';
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
	if (mins < 60) return `${mins}min atras`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h atras`;
	const days = Math.floor(hours / 24);
	return `${days}d atras`;
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
	const update = useUpdateForumReply(postId);

	const [admin, setAdmin] = useState(false);
	useEffect(() => setAdmin(isAdmin()), []);

	const isOwner = reply.authorId === currentUserId;

	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(reply.content);

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

	function handleStartEdit() {
		setEditContent(reply.content);
		setIsEditing(true);
	}

	function handleCancelEdit() {
		setIsEditing(false);
		setEditContent(reply.content);
	}

	function handleSaveEdit() {
		const trimmed = editContent.trim();
		if (!trimmed) return;
		update.mutate(
			{ replyId: reply.id, content: trimmed },
			{
				onSuccess: () => {
					setIsEditing(false);
					toast.success('Resposta atualizada');
				},
				onError: () => toast.error('Erro ao atualizar resposta'),
			},
		);
	}

	return (
		<div
			className={`p-4 rounded-xl border transition-colors ${
				reply.isAccepted
					? 'border-emerald-400/50 bg-emerald-50 dark:bg-emerald-500/10'
					: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]'
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
								: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400'
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
							<span className="px-1.5 py-0.5 text-xs font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 rounded-md">
								Instrutor
							</span>
						)}
						{reply.isAccepted && (
							<span className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md">
								<CheckCircle2 className="w-3 h-3" />
								Aceita
							</span>
						)}
						<span className="text-xs text-slate-400 dark:text-gray-500 ml-auto">
							{timeAgo(reply.createdAt)}
						</span>
					</div>

					{isEditing ? (
						<div className="space-y-2">
							<textarea
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-700 dark:text-slate-300 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40"
								rows={3}
							/>
							<div className="flex gap-2 justify-end">
								<button
									type="button"
									onClick={handleCancelEdit}
									className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
								>
									Cancelar
								</button>
								<button
									type="button"
									onClick={handleSaveEdit}
									disabled={update.isPending || !editContent.trim()}
									className="px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg transition-colors"
								>
									{update.isPending ? 'Salvando...' : 'Salvar'}
								</button>
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
							{reply.content}
						</p>
					)}
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
							onClick={handleStartEdit}
							title="Editar resposta"
							className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
						>
							<Pencil className="w-4 h-4" />
						</button>
					)}
					{(isOwner || admin) && (
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
