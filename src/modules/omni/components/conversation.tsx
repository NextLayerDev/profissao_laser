'use client';

import {
	Archive,
	Bot,
	Check,
	CheckCheck,
	Download,
	Loader2,
	MessageSquare,
	Paperclip,
	PauseCircle,
	PlayCircle,
	Send,
	User,
	X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { useOmniChatMutations } from '../hooks/use-omni';
import type { OmniChat, OmniMessage } from '../types/omni';

function StatusTicks({ status }: { status: OmniMessage['status'] }) {
	if (status === 'read') {
		return <CheckCheck className="h-3.5 w-3.5 text-sky-400" />;
	}
	if (status === 'delivered') {
		return <CheckCheck className="h-3.5 w-3.5 text-slate-400" />;
	}
	if (status === 'sent')
		return <Check className="h-3.5 w-3.5 text-slate-400" />;
	if (status === 'failed') return <X className="h-3.5 w-3.5 text-red-500" />;
	return <Loader2 className="h-3 w-3 animate-spin text-slate-400" />;
}

export function MessageItem({ m }: { m: OmniMessage }) {
	const mine = m.direction === 'out';
	return (
		<div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
			<div
				className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
					mine
						? 'bg-violet-600 text-white rounded-br-md'
						: 'bg-white dark:bg-white/10 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-white/10'
				}`}
			>
				{mine && (
					<p
						className={`mb-0.5 flex items-center gap-1 text-[10px] font-semibold ${mine ? 'text-violet-200' : 'text-slate-400'}`}
					>
						{m.author_type === 'ai' ? (
							<>
								<Bot className="h-3 w-3" /> IA
							</>
						) : (
							<>
								<User className="h-3 w-3" /> {m.sender_name ?? 'Atendente'}
							</>
						)}
					</p>
				)}
				{m.media_type === 'image' && m.media_url && (
					<img
						src={m.media_url}
						alt={m.caption ?? 'imagem'}
						className="mb-1 max-h-64 rounded-xl object-contain cursor-pointer"
						onClick={() => window.open(m.media_url ?? '', '_blank')}
						onKeyDown={() => {}}
					/>
				)}
				{m.media_type === 'audio' && m.media_url && (
					// biome-ignore lint/a11y/useMediaCaption: áudio de conversa
					<audio controls src={m.media_url} className="mb-1 max-w-full" />
				)}
				{m.media_type === 'video' && m.media_url && (
					// biome-ignore lint/a11y/useMediaCaption: vídeo de conversa
					<video
						controls
						src={m.media_url}
						className="mb-1 max-h-64 rounded-xl"
					/>
				)}
				{m.media_type === 'document' && (
					<a
						href={m.media_url ?? '#'}
						target="_blank"
						rel="noreferrer"
						className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${mine ? 'bg-white/15' : 'bg-slate-100 dark:bg-white/5'}`}
					>
						<Download className="h-3.5 w-3.5" />
						{m.file_name ?? 'documento'}
					</a>
				)}
				{(m.content || m.caption) && (
					<p className="whitespace-pre-wrap break-words">
						{m.content ?? m.caption}
					</p>
				)}
				{m.transcription && m.direction === 'in' && (
					<p className="mt-1 text-xs italic opacity-70">“{m.transcription}”</p>
				)}
				{m.error && <p className="mt-1 text-xs text-red-300">{m.error}</p>}
				<div
					className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-violet-200' : 'text-slate-400'}`}
				>
					{new Date(m.wa_timestamp ?? m.created_at).toLocaleTimeString(
						'pt-BR',
						{
							hour: '2-digit',
							minute: '2-digit',
						},
					)}
					{mine && <StatusTicks status={m.status} />}
				</div>
			</div>
		</div>
	);
}

export function Conversation({
	chat,
	messages,
	isLoading,
	mutations,
}: {
	chat: OmniChat;
	messages: OmniMessage[];
	isLoading: boolean;
	mutations: ReturnType<typeof useOmniChatMutations>;
}) {
	const [text, setText] = useState('');
	const bottomRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const name =
		chat.contact?.name ||
		chat.contact?.push_name ||
		chat.wa_chat_id.split('@')[0];

	// biome-ignore lint/correctness/useExhaustiveDependencies: rola ao fim quando CHEGA mensagem (length), não a cada refetch
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages.length]);

	async function handleSend() {
		const value = text.trim();
		if (!value) return;
		setText('');
		try {
			await mutations.sendText.mutateAsync({ chatId: chat.id, text: value });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Falha ao enviar');
			setText(value);
		}
	}

	async function handleFile(file: File) {
		if (file.size > 16 * 1024 * 1024) {
			toast.error('Arquivo acima de 16MB');
			return;
		}
		try {
			await mutations.sendFile.mutateAsync({ chatId: chat.id, file });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Falha ao enviar arquivo',
			);
		}
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header do chat */}
			<div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
						{name}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400">
						{chat.wa_chat_id.split('@')[0]}
						{chat.status === 'window_closed' &&
							' · janela de 24h expirada (aguarde o cliente escrever)'}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<button
						type="button"
						title={
							chat.ia_paused ? 'Retomar IA neste chat' : 'Pausar IA neste chat'
						}
						onClick={() =>
							mutations.patchChat.mutate({
								chatId: chat.id,
								patch: { ia_paused: !chat.ia_paused },
							})
						}
						className={`rounded-lg p-2 text-xs ${chat.ia_paused ? 'text-amber-500' : 'text-slate-400'} hover:bg-slate-100 dark:hover:bg-white/10`}
					>
						{chat.ia_paused ? (
							<PlayCircle className="h-4 w-4" />
						) : (
							<PauseCircle className="h-4 w-4" />
						)}
					</button>
					{chat.assigned_to === 'ai' ? (
						<button
							type="button"
							onClick={() =>
								mutations.transfer.mutate({ chatId: chat.id, to: 'user' })
							}
							className="rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-300 hover:bg-sky-500/20"
						>
							Assumir atendimento
						</button>
					) : (
						<button
							type="button"
							onClick={() =>
								mutations.transfer.mutate({ chatId: chat.id, to: 'ai' })
							}
							className="rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300 hover:bg-violet-500/20"
						>
							Devolver pra IA
						</button>
					)}
					<button
						type="button"
						title="Arquivar"
						onClick={() =>
							mutations.patchChat.mutate({
								chatId: chat.id,
								patch: { is_archived: !chat.is_archived },
							})
						}
						className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
					>
						<Archive className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* Mensagens */}
			<div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/50 dark:bg-black/20 p-4">
				{isLoading ? (
					<div className="flex justify-center py-10">
						<Loader2 className="h-6 w-6 animate-spin text-violet-500" />
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center py-16 text-slate-400">
						<MessageSquare className="mb-2 h-8 w-8 opacity-50" />
						<p className="text-sm">Sem mensagens ainda</p>
					</div>
				) : (
					messages.map((m) => <MessageItem key={m.id} m={m} />)
				)}
				<div ref={bottomRef} />
			</div>

			{/* Composer */}
			<div className="border-t border-slate-200 dark:border-white/10 p-3">
				<div className="flex items-end gap-2">
					<input
						ref={fileRef}
						type="file"
						className="hidden"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) handleFile(f);
							e.target.value = '';
						}}
					/>
					<button
						type="button"
						onClick={() => fileRef.current?.click()}
						className="shrink-0 rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
						title="Anexar arquivo"
					>
						<Paperclip className="h-5 w-5" />
					</button>
					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleSend();
							}
						}}
						rows={1}
						placeholder="Digite uma mensagem (envia como atendente)…"
						className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={!text.trim() || mutations.sendText.isPending}
						className="shrink-0 rounded-xl bg-violet-600 p-2.5 text-white disabled:opacity-50"
					>
						{mutations.sendText.isPending ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<Send className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
