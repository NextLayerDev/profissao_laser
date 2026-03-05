'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';
import type { ChatMessage, DoubtChat } from '@/types/doubt-chat';

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

function MessageBubble({ msg }: { msg: ChatMessage }) {
	return (
		<div
			className={`flex ${msg.isTechnician ? 'justify-start' : 'justify-end'}`}
		>
			<div
				className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
					msg.isTechnician
						? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-bl-md'
						: 'bg-violet-600 text-white rounded-br-md'
				}`}
			>
				<p className="text-sm leading-relaxed">{msg.content}</p>
				<p className="text-xs mt-1 opacity-80">
					{msg.authorName} · {formatDate(msg.createdAt)}
				</p>
			</div>
		</div>
	);
}

export interface DoubtChatViewProps {
	chat: DoubtChat;
	customerName: string;
	onSendMessage?: (content: string) => void;
}

export function DoubtChatView({
	chat,
	customerName: _customerName,
	onSendMessage,
}: DoubtChatViewProps) {
	const [newMessage, setNewMessage] = useState('');

	function handleSend(e: React.FormEvent) {
		e.preventDefault();
		const content = newMessage.trim();
		if (!content || !onSendMessage) return;
		onSendMessage(content);
		setNewMessage('');
	}

	return (
		<div className="flex flex-col h-full min-h-[300px]">
			{/* Header */}
			<div className="border-b border-slate-200 dark:border-white/10 pb-3 mb-3">
				<h3 className="font-semibold text-slate-900 dark:text-white">
					{chat.categoryName}
				</h3>
				{chat.technicianName && (
					<p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
						Técnico: {chat.technicianName}
					</p>
				)}
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
				{chat.messages.map((msg) => (
					<MessageBubble key={msg.id} msg={msg} />
				))}
			</div>

			{/* Input (mock - apenas visual) */}
			{onSendMessage && (
				<form
					onSubmit={handleSend}
					className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10"
				>
					<div className="flex gap-2">
						<textarea
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							placeholder="Escreva sua mensagem..."
							rows={2}
							className="flex-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none text-sm resize-none"
						/>
						<button
							type="submit"
							disabled={!newMessage.trim()}
							className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
						>
							<Send className="w-5 h-5" />
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
