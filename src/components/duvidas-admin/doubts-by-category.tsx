'use client';

import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { DoubtChat } from '@/types/doubt-chat';
import {
	addMockMessage,
	getMockChatsByCategory,
} from '@/utils/mock/doubt-chat-mock';

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-PT', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

function DoubtItem({
	doubt,
	onReply,
}: {
	doubt: DoubtChat;
	onReply: (doubtId: string, content: string) => void;
}) {
	const [replyText, setReplyText] = useState('');
	const [replying, setReplying] = useState(false);

	async function handleReply(e: React.FormEvent) {
		e.preventDefault();
		const content = replyText.trim();
		if (!content) return;
		setReplying(true);
		try {
			onReply(doubt.id, content);
			setReplyText('');
		} finally {
			setReplying(false);
		}
	}

	const lastMessage = doubt.messages[doubt.messages.length - 1];

	return (
		<div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
			<div>
				<p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
					{doubt.customerName ?? 'Cliente'} ·{' '}
					{doubt.technicianName ?? 'Sem técnico'}
				</p>
				{lastMessage && (
					<p className="text-sm text-slate-900 dark:text-white leading-relaxed">
						{lastMessage.content}
					</p>
				)}
				<p className="text-xs text-slate-500 mt-2">
					{formatDate(doubt.updatedAt)} ·{' '}
					<span
						className={
							doubt.status === 'pending'
								? 'text-amber-600 dark:text-amber-400 font-medium'
								: 'text-emerald-600 dark:text-emerald-400'
						}
					>
						{doubt.status === 'pending' ? 'Pendente' : 'Respondida'}
					</span>
				</p>
			</div>
			{doubt.messages
				.filter((m) => m.isTechnician)
				.map((r) => (
					<div key={r.id} className="pl-4 border-l-2 border-violet-500/30 py-2">
						<p className="text-sm text-slate-700 dark:text-slate-200">
							{r.content}
						</p>
						<p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
							{r.authorName} · {formatDate(r.createdAt)}
						</p>
					</div>
				))}
			<form onSubmit={handleReply} className="flex gap-2">
				<input
					type="text"
					value={replyText}
					onChange={(e) => setReplyText(e.target.value)}
					placeholder="Responder..."
					className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
				/>
				<button
					type="submit"
					disabled={!replyText.trim() || replying}
					className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
				>
					{replying ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Send className="w-4 h-4" />
					)}
					Responder
				</button>
			</form>
		</div>
	);
}

export interface DoubtsByCategoryProps {
	categoryId: string;
	categoryName: string;
}

export function DoubtsByCategory({
	categoryId,
	categoryName: _categoryName,
}: DoubtsByCategoryProps) {
	const [, setRefresh] = useState(0);
	const chats = getMockChatsByCategory(categoryId);

	function handleReply(doubtId: string, content: string) {
		addMockMessage(doubtId, {
			content,
			authorId: 'tech-1',
			authorName: 'Técnico',
			isTechnician: true,
		});
		toast.success('Resposta enviada!');
		setRefresh((r) => r + 1);
	}

	if (chats.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-600">
				<MessageSquare className="w-10 h-10 mb-2 opacity-50" />
				<p className="text-sm">Nenhuma dúvida nesta categoria ainda.</p>
			</div>
		);
	}

	return (
		<div className="space-y-3 mt-3">
			{chats.map((doubt) => (
				<DoubtItem key={doubt.id} doubt={doubt} onReply={handleReply} />
			))}
		</div>
	);
}
