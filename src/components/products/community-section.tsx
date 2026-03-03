'use client';

import { Hash, Loader2, MessageSquare, Plus, Send } from 'lucide-react';
import { formatMessageTime } from '@/utils/formatDate';

/** Exibe o nome do canal; evita mostrar UUID ou ID técnico como nome */
function getChannelDisplayName(label: string | undefined, id: string): string {
	if (!label) return 'Canal';
	const normalized = label.replace(/\s/g, '');
	if (label === id || label.replace(/\s/g, '') === id.replace(/\s/g, ''))
		return 'Canal';
	if (/^[0-9a-f-]{32,}$/i.test(normalized)) return 'Canal';
	return label;
}

import { useState } from 'react';
import {
	useChannelMessages,
	useCommunityChannels,
	useCreateChannel,
	useSendChannelMessage,
} from '@/hooks/use-community';
import type { Channel } from '@/types/community';

export function CommunitySection() {
	const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
		null,
	);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newChannelName, setNewChannelName] = useState('');
	const [messageInput, setMessageInput] = useState('');

	const { data: channels = [], isLoading: channelsLoading } =
		useCommunityChannels();
	const { data: messages = [], isLoading: messagesLoading } =
		useChannelMessages(selectedChannelId);
	const createChannelMutation = useCreateChannel();
	const sendMessageMutation = useSendChannelMessage(selectedChannelId);

	const selectedChannel = channels.find((c) => c.id === selectedChannelId);

	const handleCreateChannel = () => {
		if (!newChannelName.trim()) return;
		createChannelMutation.mutate(newChannelName, {
			onSuccess: () => {
				setNewChannelName('');
				setShowCreateModal(false);
			},
		});
	};

	const handleSendMessage = () => {
		if (!messageInput.trim() || !selectedChannelId) return;
		sendMessageMutation.mutate(messageInput, {
			onSuccess: () => setMessageInput(''),
		});
	};

	const channelCategories = channels.reduce<
		{ name: string; channels: Channel[] }[]
	>((acc, ch) => {
		const existing = acc.find((c) => c.name === ch.category);
		if (existing) existing.channels.push(ch);
		else acc.push({ name: ch.category, channels: [ch] });
		return acc;
	}, []);

	return (
		<div className="flex gap-6 h-[calc(100vh-200px)] min-h-[400px]">
			{/* Sidebar - Canais */}
			<aside className="w-64 bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none shrink-0 overflow-hidden flex flex-col">
				<div className="p-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
					<h3 className="font-semibold text-slate-900 dark:text-white">
						Canais
					</h3>
					<button
						type="button"
						onClick={() => setShowCreateModal(true)}
						className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium"
						title="Criar canal"
					>
						<Plus className="h-4 w-4" />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-2">
					{channelsLoading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
						</div>
					) : channelCategories.length === 0 ? (
						<div className="text-center py-8 text-slate-500 dark:text-gray-400 text-sm">
							<MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
							<p>Nenhum canal ainda.</p>
							<p className="text-xs mt-1">Clique em + para criar.</p>
						</div>
					) : (
						<div className="space-y-4">
							{channelCategories.map((cat) => (
								<div key={cat.name}>
									<div className="px-2 py-1 text-xs font-bold text-violet-500 uppercase">
										{cat.name}
									</div>
									<div className="space-y-0.5">
										{cat.channels.map((ch) => (
											<button
												key={ch.id}
												type="button"
												onClick={() => setSelectedChannelId(ch.id)}
												className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
													selectedChannelId === ch.id
														? 'bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300'
														: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528]'
												}`}
											>
												<Hash className="h-4 w-4 shrink-0" />
												<span className="truncate">{ch.label}</span>
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</aside>

			{/* Área de mensagens */}
			<div className="flex-1 bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col overflow-hidden">
				{selectedChannelId ? (
					<>
						<div className="p-4 border-b border-slate-200 dark:border-gray-800">
							<h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
								<Hash className="h-4 w-4" />
								{getChannelDisplayName(
									selectedChannel?.label ?? undefined,
									selectedChannelId ?? '',
								)}
							</h3>
							{selectedChannel?.description && (
								<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
									{selectedChannel.description}
								</p>
							)}
						</div>

						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{messagesLoading ? (
								<div className="flex justify-center py-12">
									<Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
								</div>
							) : messages.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 dark:text-gray-400">
									<MessageSquare className="h-12 w-12 mb-4 opacity-50" />
									<p>Nenhuma mensagem ainda.</p>
									<p className="text-sm mt-1">Seja o primeiro a enviar!</p>
								</div>
							) : (
								messages.map((msg) => (
									<div
										key={msg.id}
										className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
									>
										<div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
											{msg.avatar ?? msg.user.substring(0, 2).toUpperCase()}
										</div>
										<div
											className={`flex flex-col max-w-[75%] ${
												msg.isMe ? 'items-end' : 'items-start'
											}`}
										>
											<div className="flex items-baseline gap-2 mb-0.5">
												<span className="text-sm font-medium text-slate-900 dark:text-white">
													{msg.user}
												</span>
												<span className="text-xs text-slate-500 dark:text-gray-500">
													{formatMessageTime(msg.time)}
												</span>
											</div>
											<div
												className={`px-4 py-2 rounded-xl text-sm ${
													msg.isMe
														? 'bg-violet-600 text-white'
														: 'bg-slate-100 dark:bg-[#252528] text-slate-900 dark:text-white'
												}`}
											>
												{msg.content}
											</div>
										</div>
									</div>
								))
							)}
						</div>

						<div className="p-4 border-t border-slate-200 dark:border-gray-800">
							<div className="flex gap-2">
								<input
									type="text"
									placeholder={`Enviar mensagem em #${getChannelDisplayName(selectedChannel?.label ?? undefined, selectedChannelId ?? '')}...`}
									value={messageInput}
									onChange={(e) => setMessageInput(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
									className="flex-1 h-11 px-4 rounded-full bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
								/>
								<button
									type="button"
									onClick={handleSendMessage}
									disabled={
										!messageInput.trim() || sendMessageMutation.isPending
									}
									className="h-11 px-6 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium flex items-center gap-2"
								>
									<Send className="h-4 w-4" />
									Enviar
								</button>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400">
						<MessageSquare className="h-16 w-16 mb-4 opacity-50" />
						<p className="font-medium">Selecione um canal</p>
						<p className="text-sm mt-1">
							Escolha um canal na barra lateral para ver e enviar mensagens.
						</p>
					</div>
				)}
			</div>

			{/* Modal Criar Canal */}
			{showCreateModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
					<button
						type="button"
						aria-label="Fechar modal"
						className="absolute inset-0 cursor-default"
						onClick={() => setShowCreateModal(false)}
						onKeyDown={(e) => e.key === 'Escape' && setShowCreateModal(false)}
					/>
					<div
						role="dialog"
						className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.key === 'Escape' && setShowCreateModal(false)}
					>
						<div className="mx-auto w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
							<Hash className="h-7 w-7 text-violet-500" />
						</div>
						<h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">
							Criar Novo Canal
						</h3>
						<p className="text-slate-500 dark:text-gray-400 text-center mt-1 text-sm">
							Crie um espaço para discussões na comunidade
						</p>
						<div className="mt-6 space-y-2">
							<label
								htmlFor="channel-name"
								className="text-sm font-medium text-slate-700 dark:text-gray-300"
							>
								Nome do Canal
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500 font-bold">
									#
								</span>
								<input
									id="channel-name"
									type="text"
									placeholder="nome-do-canal"
									value={newChannelName}
									onChange={(e) => setNewChannelName(e.target.value)}
									className="w-full pl-8 h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
								/>
							</div>
						</div>
						<button
							type="button"
							onClick={handleCreateChannel}
							disabled={
								!newChannelName.trim() || createChannelMutation.isPending
							}
							className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl"
						>
							{createChannelMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Plus className="h-4 w-4" />
							)}
							Criar Canal
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
