'use client';

import { Paperclip, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChatMessage, DoubtChat } from '@/types/doubt-chat';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

function isImage(url: string) {
	const lower = url.toLowerCase().split('?')[0];
	return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
}

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
				{msg.content && (
					<p className="text-sm leading-relaxed">{msg.content}</p>
				)}
				{msg.fileUrl && (
					<div className="mt-1.5">
						{isImage(msg.fileUrl) ? (
							<img
								src={msg.fileUrl}
								alt="anexo"
								className="max-w-full max-h-64 rounded-lg object-contain"
							/>
						) : (
							<a
								href={msg.fileUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 text-sm underline underline-offset-2 opacity-90 hover:opacity-100"
							>
								<Paperclip className="w-3.5 h-3.5 shrink-0" />
								{msg.fileUrl.split('/').pop() ?? 'ficheiro'}
							</a>
						)}
					</div>
				)}
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
	onSendMessage?: (content: string, file?: File) => void;
}

export function DoubtChatView({
	chat,
	customerName: _customerName,
	onSendMessage,
}: DoubtChatViewProps) {
	const [newMessage, setNewMessage] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function handleSend(e: React.FormEvent) {
		e.preventDefault();
		const content = newMessage.trim();
		if (!content && !selectedFile) return;
		if (!onSendMessage) return;
		onSendMessage(content, selectedFile ?? undefined);
		setNewMessage('');
		setSelectedFile(null);
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
				{(chat.messages ?? []).map((msg) => (
					<MessageBubble key={msg.id} msg={msg} />
				))}
			</div>

			{/* Input */}
			{onSendMessage && (
				<form
					onSubmit={handleSend}
					className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10"
				>
					{selectedFile && (
						<div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 rounded-lg w-fit max-w-full">
							<Paperclip className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
							<span className="text-xs text-violet-700 dark:text-violet-300 truncate max-w-[200px]">
								{selectedFile.name}
							</span>
							<button
								type="button"
								onClick={() => setSelectedFile(null)}
								className="ml-0.5 text-violet-500 hover:text-violet-700 dark:hover:text-violet-200 shrink-0"
								aria-label="Remover ficheiro"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>
					)}
					<div className="flex gap-2">
						<input
							ref={fileInputRef}
							type="file"
							className="hidden"
							onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
						/>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="px-3 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl transition-colors shrink-0"
							aria-label="Anexar ficheiro"
						>
							<Paperclip className="w-5 h-5" />
						</button>
						<textarea
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							placeholder="Escreva sua mensagem..."
							rows={2}
							className="flex-1 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none text-sm resize-none"
						/>
						<button
							type="submit"
							disabled={!newMessage.trim() && !selectedFile}
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
