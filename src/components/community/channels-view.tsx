'use client';

import {
	ChevronDown,
	ChevronUp,
	FileText,
	Folder,
	Hash,
	HelpCircle,
	ImageIcon,
	Link2,
	Loader2,
	Lock,
	Megaphone,
	MessageSquare,
	Mic,
	Paperclip,
	Plus,
	Search,
	Send,
	Settings,
	Sparkles,
	Users,
	X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	useChannelMessages,
	useCommunityChannels,
	useCreateChannel,
	useSendChannelMessage,
} from '@/hooks/use-community';
import { useUsers } from '@/hooks/use-users';
import type { Channel } from '@/types/community';
import { buildUserDisplayMap, getMessageDisplayName } from '@/utils/community';
import { formatMessageTime } from '@/utils/formatDate';

const CHANNEL_ICON_MAP: Record<string, typeof MessageSquare> = {
	chat: MessageSquare,
	fiber: MessageSquare,
	uv: MessageSquare,
	duvidas: HelpCircle,
	links: Link2,
	parametros: Settings,
	banco: Folder,
	equipe: Users,
	passo: FileText,
	tutoriais: FileText,
	arquivos: Folder,
	live: Mic,
	regras: Megaphone,
	anuncio: Megaphone,
};
const DEFAULT_CHANNEL_ICON = MessageSquare;

function getChannelIcon(channel: Channel) {
	const id = channel.id.toLowerCase();
	for (const [key, icon] of Object.entries(CHANNEL_ICON_MAP)) {
		if (id.includes(key)) return icon;
	}
	return DEFAULT_CHANNEL_ICON;
}

function highlightSearchText(text: string, search: string): React.ReactNode {
	if (!search.trim()) return text;
	const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
	return parts.map((part, i) =>
		part.toLowerCase() === search.toLowerCase().trim() ? (
			<mark
				key={`${i}-${part}`}
				className="bg-cyan-200 dark:bg-cyan-600/40 rounded px-0.5"
			>
				{part}
			</mark>
		) : (
			part
		),
	);
}

interface ChannelsViewProps {
	userName: string;
	userEmail: string;
	userInitials: string;
	isAdmin?: boolean;
}

export function ChannelsView({
	userName: _userName,
	userEmail: _userEmail,
	userInitials: _userInitials,
	isAdmin = false,
}: ChannelsViewProps) {
	const [activeChannel, setActiveChannel] = useState<string | null>(null);
	const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
	const [newChannelName, setNewChannelName] = useState('');
	const [messageInput, setMessageInput] = useState('');
	const [messageFile, setMessageFile] = useState<File | null>(null);
	const [chatSearchQuery, setChatSearchQuery] = useState('');
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

	const channelMessagesScrollRef = useRef<HTMLDivElement>(null);
	const channelFileInputRef = useRef<HTMLInputElement>(null);
	const channelMessageTextareaRef = useRef<HTMLTextAreaElement>(null);
	const matchRefsMap = useRef<Map<number, HTMLDivElement | null>>(new Map());

	const { data: channels = [], isLoading: channelsLoading } =
		useCommunityChannels();
	const {
		data: channelMessages = [],
		refetch: refetchMessages,
		isLoading: messagesLoading,
	} = useChannelMessages(activeChannel);
	const { users } = useUsers(true);
	const userMap = useMemo(() => buildUserDisplayMap(users), [users]);

	const createChannelMutation = useCreateChannel();
	const sendMessageMutation = useSendChannelMessage(activeChannel);

	const channelCategories = useMemo(() => {
		const sorted = [...channels].sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0),
		);
		const byCategory = new Map<string, Channel[]>();
		for (const ch of sorted) {
			const cat = ch.category || 'GERAL';
			if (!byCategory.has(cat)) byCategory.set(cat, []);
			byCategory.get(cat)?.push(ch);
		}
		return Array.from(byCategory.entries())
			.map(([name, chs]) => ({ name, channels: chs }))
			.sort(
				(a, b) =>
					Math.min(...a.channels.map((c) => c.order ?? 0)) -
					Math.min(...b.channels.map((c) => c.order ?? 0)),
			);
	}, [channels]);

	// Auto-seleciona o 1º canal visível (ex.: só "Fiber" sobrando após ocultar os demais)
	useEffect(() => {
		if (activeChannel || channels.length === 0) return;
		const first = [...channels].sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0),
		)[0];
		if (first) setActiveChannel(first.id);
	}, [activeChannel, channels]);

	const activeChannelData = channels.find((c) => c.id === activeChannel);
	const activeChannelLabel = (() => {
		const label = activeChannelData?.label ?? activeChannel;
		if (!label) return 'Canal';
		const normalized = label.replace(/\s/g, '');
		if (
			label === activeChannel ||
			normalized === (activeChannel ?? '').replace(/\s/g, '')
		)
			return 'Canal';
		if (/^[0-9a-f-]{32,}$/i.test(normalized)) return 'Canal';
		return label;
	})();

	const filteredChannelMessages = useMemo(() => {
		if (!chatSearchQuery.trim()) return channelMessages;
		const q = chatSearchQuery.toLowerCase().trim();
		return channelMessages.filter((m) => m.content?.toLowerCase().includes(q));
	}, [channelMessages, chatSearchQuery]);

	const resizeMessageTextarea = (el: HTMLTextAreaElement | null) => {
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: activeChannel triggers reset on channel switch
	useEffect(() => {
		setChatSearchQuery('');
		setIsSearchOpen(false);
		setCurrentMatchIndex(0);
	}, [activeChannel]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: activeChannel and channelMessages trigger scroll
	useEffect(() => {
		if (chatSearchQuery.trim()) return;
		const el = channelMessagesScrollRef.current;
		if (!el) return;
		const scrollToBottom = () => {
			el.scrollTop = el.scrollHeight;
		};
		scrollToBottom();
		requestAnimationFrame(scrollToBottom);
		setTimeout(scrollToBottom, 150);
	}, [activeChannel, channelMessages, chatSearchQuery]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: chatSearchQuery and filteredChannelMessages.length trigger index reset
	useEffect(() => {
		setCurrentMatchIndex(0);
	}, [chatSearchQuery, filteredChannelMessages.length]);

	useEffect(() => {
		if (!chatSearchQuery.trim() || filteredChannelMessages.length === 0) return;
		const el = matchRefsMap.current.get(currentMatchIndex);
		el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}, [chatSearchQuery, filteredChannelMessages, currentMatchIndex]);

	const goToPrevMatch = () => {
		setCurrentMatchIndex((i) =>
			i <= 0 ? filteredChannelMessages.length - 1 : i - 1,
		);
	};
	const goToNextMatch = () => {
		setCurrentMatchIndex((i) =>
			i >= filteredChannelMessages.length - 1 ? 0 : i + 1,
		);
	};

	const handleSendMessage = () => {
		if ((!messageInput.trim() && !messageFile) || !activeChannel) return;
		sendMessageMutation.mutate(
			{ content: messageInput.trim(), file: messageFile ?? undefined },
			{
				onSuccess: () => {
					setMessageInput('');
					setMessageFile(null);
					if (channelFileInputRef.current) {
						channelFileInputRef.current.value = '';
					}
					resizeMessageTextarea(channelMessageTextareaRef.current);
					refetchMessages();
				},
			},
		);
	};

	const handleCreateChannel = () => {
		if (!newChannelName.trim()) return;
		createChannelMutation.mutate(
			{ name: newChannelName.trim(), adminOnly: false },
			{
				onSuccess: () => {
					setNewChannelName('');
					setShowCreateChannelModal(false);
				},
			},
		);
	};

	return (
		<>
			{/* Create Channel Modal */}
			{showCreateChannelModal && (
				<ModalOverlay onClose={() => setShowCreateChannelModal(false)}>
					<div className="p-6">
						<div className="mx-auto w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
							<Hash className="h-8 w-8 text-violet-400" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
							Criar Novo Canal
						</h3>
						<p className="text-slate-600 dark:text-gray-400 text-center mt-1">
							Crie um espaco para discussoes sobre personalizacao laser
						</p>
						<div className="mt-6 space-y-2">
							<label
								htmlFor="channel-name"
								className="text-sm font-medium text-slate-900 dark:text-white"
							>
								Nome do Canal
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-600 font-bold">
									#
								</span>
								<input
									id="channel-name"
									type="text"
									placeholder="nome-do-canal"
									value={newChannelName}
									onChange={(e) => setNewChannelName(e.target.value)}
									className="w-full pl-8 h-12 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
								/>
							</div>
						</div>
						<button
							type="button"
							onClick={handleCreateChannel}
							disabled={!newChannelName.trim()}
							className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-600 disabled:opacity-50 text-white font-medium rounded-full"
						>
							<Sparkles className="h-4 w-4" /> Criar Canal
						</button>
					</div>
				</ModalOverlay>
			)}

			{/* Two-panel layout */}
			<div className="flex h-[calc(100vh-4rem)]">
				{/* Left panel - Channel list */}
				<div className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#1a1a1d]/60 overflow-y-auto shrink-0">
					<div className="p-4">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-xs font-bold font-display text-violet-400 uppercase tracking-wider">
								Canais
							</h4>
							{isAdmin && (
								<button
									type="button"
									onClick={() => setShowCreateChannelModal(true)}
									className="p-1.5 hover:bg-white/5 rounded-full text-violet-400"
								>
									<Plus className="h-4 w-4" />
								</button>
							)}
						</div>
						<div className="space-y-1">
							{channelCategories.length > 0 ? (
								channelCategories.map((category) => (
									<div key={category.name} className="space-y-1">
										<div className="px-4 py-2">
											<h5 className="text-[10px] font-bold text-violet-600 uppercase">
												{category.name}
											</h5>
										</div>
										{category.channels.map((channel) => {
											const isActive = activeChannel === channel.id;
											const IconComponent = getChannelIcon(channel);
											return (
												<button
													key={channel.id}
													type="button"
													onClick={() => setActiveChannel(channel.id)}
													title={channel.description ?? undefined}
													className={`w-full flex items-center gap-2 h-10 px-4 rounded-xl text-sm transition-all ${
														isActive
															? 'bg-violet-500/20 text-violet-700 dark:text-violet-400'
															: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
													}`}
												>
													<IconComponent className="h-4 w-4 text-violet-400 shrink-0" />
													<span className="flex-1 text-left truncate">
														{channel.label}
													</span>
												</button>
											);
										})}
									</div>
								))
							) : (
								<div className="px-4 py-6 text-center text-slate-500 text-sm">
									{channelsLoading
										? 'A carregar canais...'
										: 'Nenhum canal. Crie um novo!'}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Right panel - Messages */}
				<div className="flex-1 flex flex-col">
					{/* Channel header */}
					<div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#1a1a1d]/80 backdrop-blur-lg shrink-0">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-4 min-w-0">
								<div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shrink-0">
									<Hash className="h-5 w-5 text-white" />
								</div>
								<div className="min-w-0">
									<h2 className="font-bold text-lg text-slate-900 dark:text-white truncate">
										{activeChannelLabel}
									</h2>
									<p className="text-xs text-slate-600 dark:text-gray-500">
										Canal de discussao - Profissao Laser
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								{!isSearchOpen ? (
									<button
										type="button"
										onClick={() => {
											setIsSearchOpen(true);
											setTimeout(
												() =>
													document
														.getElementById('customer-chat-search-input')
														?.focus(),
												50,
											);
										}}
										className="p-2 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-white/5 transition-colors"
										title="Pesquisar no chat"
									>
										<Search className="h-4 w-4" />
									</button>
								) : (
									<div className="flex items-center gap-2">
										<div className="relative w-40 sm:w-48">
											<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 shrink-0" />
											<input
												id="customer-chat-search-input"
												type="text"
												placeholder="Pesquisar..."
												value={chatSearchQuery}
												onChange={(e) => setChatSearchQuery(e.target.value)}
												className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
											/>
											{chatSearchQuery && (
												<button
													type="button"
													onClick={() => setChatSearchQuery('')}
													className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
													title="Limpar pesquisa"
												>
													<X className="h-3.5 w-3.5" />
												</button>
											)}
										</div>
										{chatSearchQuery.trim() &&
											filteredChannelMessages.length > 1 && (
												<div className="flex items-center gap-0.5 shrink-0">
													<button
														type="button"
														onClick={goToPrevMatch}
														className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-white/5 transition-colors"
														title="Resultado anterior"
													>
														<ChevronUp className="h-4 w-4" />
													</button>
													<span className="text-xs text-slate-500 dark:text-gray-400 min-w-[3ch] text-center">
														{currentMatchIndex + 1}/
														{filteredChannelMessages.length}
													</span>
													<button
														type="button"
														onClick={goToNextMatch}
														className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-white/5 transition-colors"
														title="Proximo resultado"
													>
														<ChevronDown className="h-4 w-4" />
													</button>
												</div>
											)}
										<button
											type="button"
											onClick={() => {
												setIsSearchOpen(false);
												setChatSearchQuery('');
											}}
											className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shrink-0"
											title="Fechar pesquisa"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								)}
								<div className="flex -space-x-3">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white dark:border-[#1a1a1d] flex items-center justify-center text-xs font-bold text-white"
										>
											U{i}
										</div>
									))}
									<div className="w-9 h-9 rounded-full bg-cyan-500/50 border-2 border-white dark:border-[#1a1a1d] flex items-center justify-center text-[10px] font-bold text-white">
										+15
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Messages */}
					<div
						ref={channelMessagesScrollRef}
						className="flex-1 overflow-y-auto p-6 space-y-6"
					>
						{activeChannel &&
						messagesLoading &&
						channelMessages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-64 text-center">
								<Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
								<p className="text-slate-600 dark:text-gray-400">
									Carregando mensagens...
								</p>
							</div>
						) : activeChannel && channelMessages.length > 0 ? (
							filteredChannelMessages.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-64 text-center">
									<Search className="h-12 w-12 text-cyan-400 mb-4 opacity-50" />
									<p className="text-slate-600 dark:text-gray-400">
										Nenhuma mensagem encontrada para &quot;{chatSearchQuery}
										&quot;
									</p>
								</div>
							) : (
								filteredChannelMessages.map((msg, idx) => (
									<div
										key={msg.id}
										ref={(el) => {
											matchRefsMap.current.set(idx, el);
										}}
										data-message-id={msg.id}
										className={`flex gap-4 ${msg.isMe ? 'flex-row-reverse' : ''}`}
									>
										<Avatar
											src={msg.avatar}
											name={getMessageDisplayName(msg, userMap)}
											className="w-11 h-11 text-base"
											fallbackClassName="bg-gradient-to-br from-cyan-500 to-blue-600"
										/>
										<div
											className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[75%]`}
										>
											<div className="flex items-baseline gap-2 mb-1">
												<span className="text-sm font-bold text-slate-900 dark:text-white">
													{getMessageDisplayName(msg, userMap)}
												</span>
												<span className="text-[10px] text-slate-600 dark:text-gray-500">
													{formatMessageTime(msg.time)}
												</span>
											</div>
											<div
												className={`p-4 rounded-2xl text-sm space-y-2 ${
													msg.isMe
														? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
														: 'bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm'
												}`}
											>
												{msg.content && (
													<p className="whitespace-pre-wrap break-words">
														{highlightSearchText(
															msg.content,
															chatSearchQuery.trim(),
														)}
													</p>
												)}
												{msg.fileUrl && (
													<a
														href={msg.fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="block mt-2"
													>
														{/\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileUrl) ? (
															<img
																src={msg.fileUrl}
																alt="Anexo"
																className="max-w-full max-h-64 rounded-lg object-cover"
															/>
														) : (
															<span className="underline flex items-center gap-1">
																<ImageIcon className="h-4 w-4" />
																Ver ficheiro
															</span>
														)}
													</a>
												)}
											</div>
										</div>
									</div>
								))
							)
						) : (
							<div className="flex flex-col items-center justify-center h-64 text-center">
								<div className="p-6 rounded-full bg-cyan-500/20 mb-4">
									<MessageSquare className="h-12 w-12 text-cyan-400" />
								</div>
								<p className="text-slate-600 dark:text-gray-400">
									{activeChannel
										? 'Seja o primeiro a enviar uma mensagem!'
										: 'Selecione um canal para comecar'}
								</p>
							</div>
						)}
					</div>

					{/* Message input */}
					<div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#1a1a1d]/80 backdrop-blur-lg shrink-0">
						{!isAdmin && activeChannelData?.adminOnly === true ? (
							<div className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 text-sm">
								<Lock className="h-4 w-4 shrink-0" />
								Apenas administradores podem enviar mensagens neste canal
							</div>
						) : (
							<div className="flex gap-3 items-center">
								<input
									type="file"
									ref={channelFileInputRef}
									onChange={(e) => setMessageFile(e.target.files?.[0] ?? null)}
									accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
									className="hidden"
								/>
								<button
									type="button"
									onClick={() => channelFileInputRef.current?.click()}
									className="p-3 text-cyan-400 hover:bg-white/5 rounded-full"
									title="Anexar ficheiro"
								>
									<Paperclip className="h-5 w-5" />
								</button>
								{messageFile && (
									<span className="flex items-center gap-1 text-xs text-slate-400 max-w-[140px]">
										<span className="truncate">{messageFile.name}</span>
										<button
											type="button"
											onClick={() => {
												setMessageFile(null);
												if (channelFileInputRef.current) {
													channelFileInputRef.current.value = '';
												}
											}}
											className="p-0.5 hover:bg-white/10 rounded"
										>
											<X className="h-3 w-3" />
										</button>
									</span>
								)}
								<textarea
									ref={channelMessageTextareaRef}
									placeholder={`Enviar mensagem em #${activeChannelLabel}... (Enter = enviar, Shift+Enter = nova linha)`}
									value={messageInput}
									onChange={(e) => {
										setMessageInput(e.target.value);
										resizeMessageTextarea(e.target);
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											handleSendMessage();
										}
									}}
									rows={1}
									className="flex-1 min-h-[44px] max-h-32 py-3 px-6 rounded-2xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none overflow-y-auto"
								/>
								<button
									type="button"
									onClick={handleSendMessage}
									disabled={
										(!messageInput.trim() && !messageFile) ||
										sendMessageMutation.isPending
									}
									className="h-12 w-12 flex items-center justify-center bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-full"
								>
									<Send className="h-5 w-5" />
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
