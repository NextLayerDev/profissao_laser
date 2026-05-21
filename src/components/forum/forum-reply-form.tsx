'use client';

import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useCreateForumReply } from '@/hooks/use-forum';

interface ForumReplyFormProps {
	postId: string;
}

export function ForumReplyForm({ postId }: ForumReplyFormProps) {
	const [content, setContent] = useState('');
	const replyMut = useCreateForumReply(postId);

	async function handleSubmit() {
		const trimmed = content.trim();
		if (!trimmed) return;
		try {
			await replyMut.mutateAsync(trimmed);
			setContent('');
		} catch {
			// toast handled by mutation
		}
	}

	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
			<p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
				Sua resposta
			</p>
			<textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				rows={5}
				placeholder="Escreva sua resposta..."
				className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
			/>
			<div className="flex items-center justify-end">
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!content.trim() || replyMut.isPending}
					className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{replyMut.isPending ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Send className="w-4 h-4" />
					)}
					Responder
				</button>
			</div>
		</div>
	);
}
