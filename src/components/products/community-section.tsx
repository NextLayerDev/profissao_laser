'use client';

import {
	Calendar,
	ChevronDown,
	ChevronUp,
	FolderOpen,
	Hash,
	ImageIcon,
	Loader2,
	MessageSquare,
	Paperclip,
	Pencil,
	Plus,
	Send,
	Star,
	Trash2,
	X,
} from 'lucide-react';
import { EventsAdminSection } from '@/components/community/events-admin-section';
import { ProjectsAdminSection } from '@/components/community/projects-admin-section';
import { VectorLibraryAdminSection } from '@/components/community/vector-library-admin-section';
import { formatMessageTime } from '@/utils/formatDate';

type AdminTab = 'channels' | 'events' | 'projects' | 'vectors';

/** Exibe o nome do canal; evita mostrar UUID ou ID técnico como nome */
function getChannelDisplayName(label: string | undefined, id: string): string {
	if (!label) return 'Canal';
	const normalized = label.replace(/\s/g, '');
	if (label === id || label.replace(/\s/g, '') === id.replace(/\s/g, ''))
		return 'Canal';
	if (/^[0-9a-f-]{32,}$/i.test(normalized)) return 'Canal';
	return label;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
	useChannelMessages,
	useCommunityChannels,
	useCreateChannel,
	useDeleteChannel,
	useSendChannelMessage,
	useUpdateChannel,
} from '@/hooks/use-community';
import { useUsers } from '@/hooks/use-users';
import type { Channel } from '@/types/community';
import { buildUserDisplayMap, getMessageDisplayName } from '@/utils/community';

export function CommunitySection() {
	const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('channels');
	const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
		null,
	);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [newChannelName, setNewChannelName] = useState('');
	const [newChannelAdminOnly, setNewChannelAdminOnly] = useState(false);
	const [newChannelOrder, setNewChannelOrder] = useState(0);
	const [editChannelName, setEditChannelName] = useState('');
	const [editChannelDescription, setEditChannelDescription] = useState('');
	const [editChannelAdminOnly, setEditChannelAdminOnly] = useState(false);
	const [editChannelOrder, setEditChannelOrder] = useState(0);
	const [messageInput, setMessageInput] = useState('');
	const [messageFile, setMessageFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
	const messagesScrollRef = useRef<HTMLDivElement>(null);

	const resizeMessageTextarea = (el: HTMLTextAreaElement | null) => {
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
	};

	const { data: channels = [], isLoading: channelsLoading } =
		useCommunityChannels();
	const { data: messages = [], isLoading: messagesLoading } =
		useChannelMessages(selectedChannelId);

	useEffect(() => {
		const el = messagesScrollRef.current;
		if (!el) return;
		const scrollToBottom = () => {
			el.scrollTop = el.scrollHeight;
		};
		scrollToBottom();
		requestAnimationFrame(scrollToBottom);
		setTimeout(scrollToBottom, 100);
	}, []);

	const createChannelMutation = useCreateChannel();
	const updateChannelMutation = useUpdateChannel();
	const deleteChannelMutation = useDeleteChannel();
	const sendMessageMutation = useSendChannelMessage(selectedChannelId);

	const selectedChannel = channels.find((c) => c.id === selectedChannelId);
	const { users } = useUsers();
	const userMap = useMemo(() => buildUserDisplayMap(users), [users]);

	const handleCreateChannel = () => {
		if (!newChannelName.trim()) return;
		createChannelMutation.mutate(
			{
				name: newChannelName.trim(),
				adminOnly: newChannelAdminOnly,
				order: newChannelOrder,
			},
			{
				onSuccess: () => {
					setNewChannelName('');
					setNewChannelAdminOnly(false);
					setNewChannelOrder(0);
					setShowCreateModal(false);
				},
			},
		);
	};

	const handleOpenEditModal = () => {
		if (selectedChannel) {
			setEditChannelName(selectedChannel.label);
			setEditChannelDescription(selectedChannel.description ?? '');
			setEditChannelAdminOnly(selectedChannel.adminOnly ?? false);
			setEditChannelOrder(selectedChannel.order ?? 0);
			setShowEditModal(true);
		}
	};

	const handleUpdateChannel = () => {
		if (!selectedChannelId || !editChannelName.trim()) return;
		updateChannelMutation.mutate(
			{
				channelId: selectedChannelId,
				data: {
					name: editChannelName.trim(),
					description: editChannelDescription.trim(),
					adminOnly: editChannelAdminOnly,
					order: editChannelOrder,
				},
			},
			{
				onSuccess: () => {
					setShowEditModal(false);
				},
			},
		);
	};

	const handleDeleteChannel = () => {
		if (!selectedChannelId) return;
		deleteChannelMutation.mutate(selectedChannelId, {
			onSuccess: () => {
				setSelectedChannelId(null);
				setShowDeleteConfirm(false);
			},
		});
	};

	const handleSendMessage = () => {
		if ((!messageInput.trim() && !messageFile) || !selectedChannelId) return;
		sendMessageMutation.mutate(
			{ content: messageInput.trim(), file: messageFile ?? undefined },
			{
				onSuccess: () => {
					setMessageInput('');
					setMessageFile(null);
					if (fileInputRef.current) {
						fileInputRef.current.value = '';
					}
					resizeMessageTextarea(messageTextareaRef.current);
				},
			},
		);
	};

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

	const sortedChannelsFlat = useMemo(
		() => channelCategories.flatMap((c) => c.channels),
		[channelCategories],
	);

	const handleMoveChannel = async (
		channel: Channel,
		direction: 'up' | 'down',
	) => {
		const idx = sortedChannelsFlat.findIndex((c) => c.id === channel.id);
		if (idx < 0) return;
		const other =
			direction === 'up'
				? sortedChannelsFlat[idx - 1]
				: sortedChannelsFlat[idx + 1];
		if (!other) return;

		const myOrder = channel.order ?? 0;
		const otherOrder = other.order ?? 0;

		const updatePayload = (
			ch: Channel,
			order: number,
		): {
			name: string;
			description: string;
			adminOnly?: boolean;
			order: number;
		} => ({
			name: ch.label,
			description: ch.description ?? '',
			adminOnly: ch.adminOnly ?? false,
			order,
		});

		try {
			await updateChannelMutation.mutateAsync({
				channelId: channel.id,
				data: updatePayload(channel, otherOrder),
			});
			await updateChannelMutation.mutateAsync({
				channelId: other.id,
				data: updatePayload(other, myOrder),
			});
		} catch {
			// Erro já tratado pelo hook (toast)
		}
	};

	return (
		<div className="space-y-4">
			{/* Tabs */}
			<div className="flex gap-2 p-1 bg-slate-100 dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800 w-fit">
				<button
					type="button"
					onClick={() => setActiveAdminTab('channels')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						activeAdminTab === 'channels'
							? 'bg-white dark:bg-[#252528] text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
					}`}
				>
					<MessageSquare className="h-4 w-4" />
					Canais
				</button>
				<button
					type="button"
					onClick={() => setActiveAdminTab('events')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						activeAdminTab === 'events'
							? 'bg-white dark:bg-[#252528] text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
					}`}
				>
					<Calendar className="h-4 w-4" />
					Eventos
				</button>
				<button
					type="button"
					onClick={() => setActiveAdminTab('projects')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						activeAdminTab === 'projects'
							? 'bg-white dark:bg-[#252528] text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
					}`}
				>
					<Star className="h-4 w-4" />
					Projetos
				</button>
				<button
					type="button"
					onClick={() => setActiveAdminTab('vectors')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						activeAdminTab === 'vectors'
							? 'bg-white dark:bg-[#252528] text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
					}`}
				>
					<FolderOpen className="h-4 w-4" />
					Biblioteca de Vetores
				</button>
			</div>

			{activeAdminTab === 'vectors' ? (
				<VectorLibraryAdminSection />
			) : activeAdminTab === 'projects' ? (
				<ProjectsAdminSection />
			) : activeAdminTab === 'events' ? (
				<EventsAdminSection />
			) : (
				<div className="flex gap-6 h-[calc(100vh-260px)] min-h-[400px]">
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
												{cat.channels.map((ch) => {
													const flatIdx = sortedChannelsFlat.findIndex(
														(c) => c.id === ch.id,
													);
													const canMoveUp = flatIdx > 0;
													const canMoveDown =
														flatIdx >= 0 &&
														flatIdx < sortedChannelsFlat.length - 1;
													return (
														<div
															key={ch.id}
															className={`flex items-center gap-1 rounded-lg group ${
																selectedChannelId === ch.id
																	? 'bg-violet-100 dark:bg-violet-600/20'
																	: 'hover:bg-slate-100 dark:hover:bg-[#252528]'
															}`}
														>
															<button
																type="button"
																onClick={() => setSelectedChannelId(ch.id)}
																className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors min-w-0 ${
																	selectedChannelId === ch.id
																		? 'text-violet-700 dark:text-violet-300'
																		: 'text-slate-600 dark:text-gray-400'
																}`}
															>
																<Hash className="h-4 w-4 shrink-0" />
																<span className="truncate">{ch.label}</span>
															</button>
															<div className="flex flex-col shrink-0">
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleMoveChannel(ch, 'up');
																	}}
																	disabled={
																		!canMoveUp ||
																		updateChannelMutation.isPending
																	}
																	title="Subir"
																	className="p-0.5 rounded text-slate-500 hover:text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30 disabled:opacity-30 disabled:cursor-not-allowed"
																>
																	<ChevronUp className="h-3.5 w-3.5" />
																</button>
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleMoveChannel(ch, 'down');
																	}}
																	disabled={
																		!canMoveDown ||
																		updateChannelMutation.isPending
																	}
																	title="Descer"
																	className="p-0.5 rounded text-slate-500 hover:text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30 disabled:opacity-30 disabled:cursor-not-allowed"
																>
																	<ChevronDown className="h-3.5 w-3.5" />
																</button>
															</div>
														</div>
													);
												})}
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
									<div className="flex items-start justify-between gap-2">
										<div>
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
										<div className="flex items-center gap-1 shrink-0">
											<button
												type="button"
												onClick={handleOpenEditModal}
												className="p-2 rounded-lg text-slate-500 hover:text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
												title="Editar canal"
											>
												<Pencil className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() => setShowDeleteConfirm(true)}
												className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
												title="Excluir canal"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</div>
								</div>

								<div
									ref={messagesScrollRef}
									className="flex-1 overflow-y-auto p-4 space-y-4"
								>
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
													{msg.avatar ??
														getMessageDisplayName(msg, userMap)
															.substring(0, 2)
															.toUpperCase()}
												</div>
												<div
													className={`flex flex-col max-w-[75%] ${
														msg.isMe ? 'items-end' : 'items-start'
													}`}
												>
													<div className="flex items-baseline gap-2 mb-0.5">
														<span className="text-sm font-medium text-slate-900 dark:text-white">
															{getMessageDisplayName(msg, userMap)}
														</span>
														<span className="text-xs text-slate-500 dark:text-gray-500">
															{formatMessageTime(msg.time)}
														</span>
													</div>
													<div
														className={`px-4 py-2 rounded-xl text-sm space-y-2 ${
															msg.isMe
																? 'bg-violet-600 text-white'
																: 'bg-slate-100 dark:bg-[#252528] text-slate-900 dark:text-white'
														}`}
													>
														{msg.content && (
															<p className="whitespace-pre-wrap break-words">
																{msg.content}
															</p>
														)}
														{msg.fileUrl && (
															<a
																href={msg.fileUrl}
																target="_blank"
																rel="noopener noreferrer"
																className="block mt-2"
															>
																{/\.(jpg|jpeg|png|gif|webp)$/i.test(
																	msg.fileUrl,
																) ? (
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
									)}
								</div>

								<div className="p-4 border-t border-slate-200 dark:border-gray-800">
									<div className="flex gap-2 items-center">
										<input
											type="file"
											ref={fileInputRef}
											onChange={(e) =>
												setMessageFile(e.target.files?.[0] ?? null)
											}
											accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
											className="hidden"
										/>
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											className="p-2.5 rounded-full text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30"
											title="Anexar ficheiro"
										>
											<Paperclip className="h-5 w-5" />
										</button>
										{messageFile && (
											<span className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 max-w-[140px]">
												<span className="truncate">{messageFile.name}</span>
												<button
													type="button"
													onClick={() => {
														setMessageFile(null);
														if (fileInputRef.current) {
															fileInputRef.current.value = '';
														}
													}}
													className="p-0.5 hover:bg-slate-200 dark:hover:bg-[#252528] rounded"
												>
													<X className="h-3 w-3" />
												</button>
											</span>
										)}
										<textarea
											ref={messageTextareaRef}
											placeholder={`Enviar mensagem em #${getChannelDisplayName(selectedChannel?.label ?? undefined, selectedChannelId ?? '')}... (Enter = enviar, Shift+Enter = nova linha)`}
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
											className="flex-1 min-h-[44px] max-h-32 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none overflow-y-auto"
										/>
										<button
											type="button"
											onClick={handleSendMessage}
											disabled={
												(!messageInput.trim() && !messageFile) ||
												sendMessageMutation.isPending
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
								onKeyDown={(e) =>
									e.key === 'Escape' && setShowCreateModal(false)
								}
							/>
							<div
								role="dialog"
								className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) =>
									e.key === 'Escape' && setShowCreateModal(false)
								}
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
								<div className="mt-4">
									<label
										htmlFor="channel-order"
										className="text-sm font-medium text-slate-700 dark:text-gray-300"
									>
										Ordem (0 = primeiro)
									</label>
									<input
										id="channel-order"
										type="number"
										min={-9007199254740991}
										max={9007199254740991}
										value={newChannelOrder}
										onChange={(e) =>
											setNewChannelOrder(Number(e.target.value) || 0)
										}
										className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
									/>
								</div>
								<label className="flex items-center gap-3 mt-4 cursor-pointer">
									<input
										type="checkbox"
										checked={newChannelAdminOnly}
										onChange={(e) => setNewChannelAdminOnly(e.target.checked)}
										className="rounded border-slate-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
									/>
									<span className="text-sm text-slate-700 dark:text-gray-300">
										Apenas admins podem enviar mensagens
									</span>
								</label>
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

					{/* Modal Editar Canal */}
					{showEditModal && selectedChannel && (
						<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
							<button
								type="button"
								aria-label="Fechar modal"
								className="absolute inset-0 cursor-default"
								onClick={() => setShowEditModal(false)}
								onKeyDown={(e) => e.key === 'Escape' && setShowEditModal(false)}
							/>
							<div
								role="dialog"
								className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => e.key === 'Escape' && setShowEditModal(false)}
							>
								<div className="mx-auto w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
									<Pencil className="h-7 w-7 text-violet-500" />
								</div>
								<h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">
									Editar Canal
								</h3>
								<div className="mt-6 space-y-4">
									<div>
										<label
											htmlFor="edit-channel-name"
											className="text-sm font-medium text-slate-700 dark:text-gray-300"
										>
											Nome do Canal
										</label>
										<div className="relative mt-1">
											<span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500 font-bold">
												#
											</span>
											<input
												id="edit-channel-name"
												type="text"
												placeholder="nome-do-canal"
												value={editChannelName}
												onChange={(e) => setEditChannelName(e.target.value)}
												className="w-full pl-8 h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
											/>
										</div>
									</div>
									<div>
										<label
											htmlFor="edit-channel-description"
											className="text-sm font-medium text-slate-700 dark:text-gray-300"
										>
											Descrição
										</label>
										<textarea
											id="edit-channel-description"
											placeholder="Descrição opcional do canal"
											value={editChannelDescription}
											onChange={(e) =>
												setEditChannelDescription(e.target.value)
											}
											rows={3}
											className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none"
										/>
									</div>
									<div>
										<label
											htmlFor="edit-channel-order"
											className="text-sm font-medium text-slate-700 dark:text-gray-300"
										>
											Ordem (0 = primeiro)
										</label>
										<input
											id="edit-channel-order"
											type="number"
											min={-9007199254740991}
											max={9007199254740991}
											value={editChannelOrder}
											onChange={(e) =>
												setEditChannelOrder(Number(e.target.value) || 0)
											}
											className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
										/>
									</div>
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={editChannelAdminOnly}
											onChange={(e) =>
												setEditChannelAdminOnly(e.target.checked)
											}
											className="rounded border-slate-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
										/>
										<span className="text-sm text-slate-700 dark:text-gray-300">
											Apenas admins podem enviar mensagens
										</span>
									</label>
								</div>
								<div className="mt-6 flex gap-3">
									<button
										type="button"
										onClick={() => setShowEditModal(false)}
										className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-[#252528] font-medium"
									>
										Cancelar
									</button>
									<button
										type="button"
										onClick={handleUpdateChannel}
										disabled={
											!editChannelName.trim() || updateChannelMutation.isPending
										}
										className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl"
									>
										{updateChannelMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<>
												<Pencil className="h-4 w-4" />
												Guardar
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Modal Confirmar Exclusão */}
					{showDeleteConfirm && selectedChannel && (
						<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
							<button
								type="button"
								aria-label="Fechar"
								className="absolute inset-0 cursor-default"
								onClick={() => setShowDeleteConfirm(false)}
								onKeyDown={(e) =>
									e.key === 'Escape' && setShowDeleteConfirm(false)
								}
							/>
							<div
								role="dialog"
								className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) =>
									e.key === 'Escape' && setShowDeleteConfirm(false)
								}
							>
								<div className="mx-auto w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
									<Trash2 className="h-7 w-7 text-red-500" />
								</div>
								<h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">
									Excluir canal?
								</h3>
								<p className="text-slate-500 dark:text-gray-400 text-center mt-2 text-sm">
									O canal &quot;{selectedChannel.label}&quot; e todas as
									mensagens serão excluídos permanentemente. Esta ação não pode
									ser desfeita.
								</p>
								<div className="mt-6 flex gap-3">
									<button
										type="button"
										onClick={() => setShowDeleteConfirm(false)}
										className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-[#252528] font-medium"
									>
										Cancelar
									</button>
									<button
										type="button"
										onClick={handleDeleteChannel}
										disabled={deleteChannelMutation.isPending}
										className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-xl"
									>
										{deleteChannelMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<>
												<Trash2 className="h-4 w-4" />
												Excluir
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
