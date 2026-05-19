'use client';

import { Paperclip, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {
	VectorSupportFile,
	VectorSupportMessage,
	VectorSupportTicket,
} from '@/types/vector-support';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

function isImage(url: string) {
	const lower = url.toLowerCase().split('?')[0];
	return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
}

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

function FileAttachment({ file }: { file: VectorSupportFile }) {
	if (isImage(file.fileUrl)) {
		return (
			<img
				src={file.fileUrl}
				alt={file.fileName}
				className="max-w-full max-h-64 rounded-lg object-contain"
			/>
		);
	}
	return (
		<a
			href={file.fileUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-center gap-1.5 text-sm underline underline-offset-2 opacity-90 hover:opacity-100"
		>
			<Paperclip className="w-3.5 h-3.5 shrink-0" />
			{file.fileName}
		</a>
	);
}

function MessageBubble({
	msg,
	isAdmin = false,
}: {
	msg: VectorSupportMessage;
	isAdmin?: boolean;
}) {
	const isOwnMessage = isAdmin ? msg.isTechnician : !msg.isTechnician;

	return (
		<div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
			<div
				className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
					isOwnMessage
						? 'bg-violet-600 text-white rounded-br-md'
						: 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-bl-md'
				}`}
			>
				{msg.content && (
					<p className="text-sm leading-relaxed">{msg.content}</p>
				)}
				{msg.files.length > 0 && (
					<div className="mt-1.5 space-y-1.5">
						{msg.files.map((file) => (
							<FileAttachment key={file.id} file={file} />
						))}
					</div>
				)}
				<p className="text-xs mt-1 opacity-80">
					{msg.authorName} · {formatDate(msg.createdAt)}
				</p>
			</div>
		</div>
	);
}

export interface VectorSupportChatProps {
	ticket: VectorSupportTicket;
	onSendMessage?: (content: string, files?: File[]) => void;
	isAdmin?: boolean;
}

export function VectorSupportChat({
	ticket,
	onSendMessage,
	isAdmin = false,
}: VectorSupportChatProps) {
	const [newMessage, setNewMessage] = useState('');
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
	}, [ticket.messages]);

	function handleSend(e: React.FormEvent) {
		e.preventDefault();
		const content = newMessage.trim();
		if (!content && selectedFiles.length === 0) return;
		if (!onSendMessage) return;
		onSendMessage(
			content,
			selectedFiles.length > 0 ? selectedFiles : undefined,
		);
		setNewMessage('');
		setSelectedFiles([]);
	}

	function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (files) {
			setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
		}
		e.target.value = '';
	}

	function removeFile(index: number) {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	}

	const isClosed = ticket.status === 'closed';

	return (
		<div className="flex flex-col h-full min-h-[300px]">
			{/* Messages */}
			<div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
				{(ticket.messages ?? []).map((msg) => (
					<MessageBubble key={msg.id} msg={msg} isAdmin={isAdmin} />
				))}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			{onSendMessage && !isClosed && (
				<form
					onSubmit={handleSend}
					className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10"
				>
					{selectedFiles.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-2">
							{selectedFiles.map((file, i) => (
								<div
									key={`${file.name}-${i}`}
									className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 rounded-lg"
								>
									<Paperclip className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
									<span className="text-xs text-violet-700 dark:text-violet-400 truncate max-w-[150px]">
										{file.name}
									</span>
									<button
										type="button"
										onClick={() => removeFile(i)}
										className="ml-0.5 text-violet-600 hover:text-violet-700 dark:hover:text-violet-200 shrink-0"
									>
										<X className="w-3.5 h-3.5" />
									</button>
								</div>
							))}
						</div>
					)}
					<div className="flex gap-2">
						<input
							ref={fileInputRef}
							type="file"
							multiple
							className="hidden"
							onChange={handleFilesSelected}
						/>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="px-3 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 rounded-xl transition-colors shrink-0"
							aria-label="Anexar ficheiros"
						>
							<Paperclip className="w-5 h-5" />
						</button>
						<textarea
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							placeholder="Escreva sua mensagem..."
							rows={2}
							className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none text-sm resize-none"
						/>
						<button
							type="submit"
							disabled={!newMessage.trim() && selectedFiles.length === 0}
							className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
						>
							<Send className="w-5 h-5" />
						</button>
					</div>
				</form>
			)}

			{isClosed && (
				<div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 text-center">
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Este chamado foi encerrado.
					</p>
				</div>
			)}
		</div>
	);
}
