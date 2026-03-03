'use client';

import {
	ArrowLeft,
	Calendar,
	Clock,
	Eye,
	FileText,
	Folder,
	Hash,
	Heart,
	HelpCircle,
	Home,
	ImageIcon,
	Link2,
	Megaphone,
	MessageSquare,
	Mic,
	MoreVertical,
	Plus,
	Search,
	Send,
	Settings,
	Sparkles,
	Star,
	Trophy,
	UploadIcon,
	Users,
	Video,
	X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
	useChannelMessages,
	useCommunityChannels,
	useCommunityEvents,
	useCommunityMembers,
	useCommunityPosts,
	useCommunityProjects,
	useCommunityRanking,
	useCreateChannel,
	useCreatePost,
	useCreateProject,
	useSendChannelMessage,
} from '@/hooks/use-community';
import type { Channel, Project } from '@/types/community';
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

function getRankingGradient(pos: number): string {
	if (pos === 1) return 'from-amber-300 via-yellow-400 to-amber-500';
	if (pos === 2) return 'from-slate-300 to-slate-400';
	return 'from-orange-300 to-amber-400';
}

interface CommunityViewProps {
	userName: string;
	userEmail: string;
	userInitials: string;
	onBack: () => void;
}

export function CommunityView({
	userName,
	userEmail: _userEmail,
	userInitials,
	onBack,
}: CommunityViewProps) {
	const [activeTab, setActiveTab] = useState('feed');
	const [activeChannel, setActiveChannel] = useState<string | null>(null);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
	const [showSubmitProjectModal, setShowSubmitProjectModal] = useState(false);
	const [showCalendarModal, setShowCalendarModal] = useState(false);

	const [selectedProfile, setSelectedProfile] = useState<{
		name: string;
		avatar: string;
		specialty: string;
		image?: string;
	} | null>(null);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);

	const [memberSearch, setMemberSearch] = useState('');
	const [memberFilter, setMemberFilter] = useState('all');

	const [postContent, setPostContent] = useState('');
	const [postImage, setPostImage] = useState<string | null>(null);

	const [newProject, setNewProject] = useState({
		title: '',
		description: '',
		material: '',
		technique: '',
		image: null as string | null,
	});

	const fileInputRef = useRef<HTMLInputElement>(null);
	const projectFileInputRef = useRef<HTMLInputElement>(null);

	const [postPage] = useState(1);
	const [projectPage] = useState(1);
	const [rankingPeriod, setRankingPeriod] = useState<
		'week' | 'month' | undefined
	>('week');

	const { data: posts = [], isLoading: postsLoading } = useCommunityPosts(
		postPage,
		20,
	);
	const { data: projects = [], isLoading: _projectsLoading } =
		useCommunityProjects(projectPage, 12);
	const { data: channels = [], isLoading: channelsLoading } =
		useCommunityChannels();
	const { data: members = [], isLoading: _membersLoading } =
		useCommunityMembers(
			memberSearch || undefined,
			memberFilter === 'all' ? undefined : memberFilter,
		);
	const { data: events = [], isLoading: _eventsLoading } = useCommunityEvents();
	const { data: rankingData, isLoading: _rankingLoading } =
		useCommunityRanking(rankingPeriod);
	const { data: channelMessages = [], refetch: refetchMessages } =
		useChannelMessages(activeChannel);

	const createPostMutation = useCreatePost();
	const createProjectMutation = useCreateProject();
	const createChannelMutation = useCreateChannel();
	const sendMessageMutation = useSendChannelMessage(activeChannel);

	const rankingTop = rankingData?.top ?? [];
	const rankingRest = rankingData?.rest ?? [];

	const channelCategories = useMemo(() => {
		const byCategory = new Map<string, Channel[]>();
		for (const ch of channels) {
			const cat = ch.category || 'GERAL';
			if (!byCategory.has(cat)) byCategory.set(cat, []);
			byCategory.get(cat)?.push(ch);
		}
		return Array.from(byCategory.entries()).map(([name, chs]) => ({
			name,
			channels: chs,
		}));
	}, [channels]);

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

	const [messageInput, setMessageInput] = useState('');
	const [newChannelName, setNewChannelName] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	const handleChannelClick = (channelId: string) => {
		setActiveTab('channel');
		setActiveChannel(channelId);
	};

	const handleSendMessage = () => {
		if (!messageInput.trim() || !activeChannel) return;
		sendMessageMutation.mutate(messageInput, {
			onSuccess: () => {
				setMessageInput('');
				refetchMessages();
			},
		});
	};

	const handleCreateChannel = () => {
		if (!newChannelName.trim()) return;
		createChannelMutation.mutate(newChannelName, {
			onSuccess: () => {
				setNewChannelName('');
				setShowCreateChannelModal(false);
			},
		});
	};

	const handleViewProfile = (
		name: string,
		avatar: string,
		specialty: string,
		image?: string,
	) => {
		setSelectedProfile({ name, avatar, specialty, image });
		setShowProfileModal(true);
	};

	const handleViewDetails = (project: Project) => {
		setSelectedProject(project);
		setShowDetailsModal(true);
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => setPostImage(reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () =>
				setNewProject((prev) => ({ ...prev, image: reader.result as string }));
			reader.readAsDataURL(file);
		}
	};

	const handlePublishPost = () => {
		if (!postContent.trim()) return;
		createPostMutation.mutate(
			{ content: postContent, image: postImage ?? undefined },
			{
				onSuccess: () => {
					setPostContent('');
					setPostImage(null);
				},
			},
		);
	};

	const handleSubmitProject = () => {
		if (!newProject.title.trim() || !newProject.description.trim()) return;
		createProjectMutation.mutate(
			{
				author: userName,
				title: newProject.title,
				description: newProject.description,
				img:
					newProject.image ||
					'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2940&auto=format&fit=crop',
				material: newProject.material || undefined,
				technique: newProject.technique || undefined,
			},
			{
				onSuccess: () => {
					setNewProject({
						title: '',
						description: '',
						material: '',
						technique: '',
						image: null,
					});
					setShowSubmitProjectModal(false);
				},
			},
		);
	};

	const isPosting = createPostMutation.isPending;
	const filteredMembers = members;

	const renderContent = () => {
		switch (activeTab) {
			case 'feed':
				return (
					<div className="w-full p-6 space-y-6">
						<div className="bg-white/5 border border-white/10 rounded-2xl p-6">
							<div className="flex gap-4">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
									{userInitials}
								</div>
								<div className="flex-1 space-y-4">
									<textarea
										placeholder="Compartilhe seus projetos, dúvidas sobre personalização a laser ou conquistas..."
										value={postContent}
										onChange={(e) => setPostContent(e.target.value)}
										className="w-full min-h-[100px] p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
									/>
									{postImage && (
										<div className="relative rounded-xl overflow-hidden">
											<img
												src={postImage}
												alt="Preview"
												className="w-full max-h-48 object-cover rounded-xl"
											/>
											<button
												type="button"
												onClick={() => setPostImage(null)}
												className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
											>
												<X className="h-4 w-4" />
											</button>
										</div>
									)}
									<div className="flex justify-between items-center">
										<input
											type="file"
											ref={fileInputRef}
											onChange={handleImageUpload}
											accept="image/*"
											className="hidden"
										/>
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											className="flex items-center gap-2 px-4 py-2 text-violet-400 hover:text-violet-300 text-sm"
										>
											<ImageIcon className="h-4 w-4" /> Foto/Vídeo
										</button>
										<button
											type="button"
											onClick={handlePublishPost}
											disabled={!postContent.trim() || isPosting}
											className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium rounded-full"
										>
											<Sparkles className="h-4 w-4" />{' '}
											{isPosting ? 'Publicando...' : 'Publicar'}
										</button>
									</div>
								</div>
							</div>
						</div>

						{postsLoading ? (
							<div className="flex justify-center py-12">
								<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
							</div>
						) : posts.length === 0 ? (
							<div className="text-center py-12 text-slate-400">
								<MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Nenhum post ainda. Seja o primeiro a publicar!</p>
							</div>
						) : (
							posts.map((post) => (
								<div
									key={post.id}
									className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
								>
									<div className="p-4 flex items-start gap-4">
										<button
											type="button"
											className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer shrink-0"
											onClick={() =>
												handleViewProfile(
													post.author,
													post.avatar ??
														post.author.substring(0, 2).toUpperCase(),
													'Especialista em Personalização Laser',
												)
											}
											onKeyDown={(e) =>
												e.key === 'Enter' &&
												handleViewProfile(
													post.author,
													post.avatar ??
														post.author.substring(0, 2).toUpperCase(),
													'Especialista em Personalização Laser',
												)
											}
										>
											{post.avatar ?? post.author.substring(0, 2).toUpperCase()}
										</button>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<div>
													<button
														type="button"
														onClick={() =>
															handleViewProfile(
																post.author,
																post.avatar ??
																	post.author.substring(0, 2).toUpperCase(),
																'Especialista em Personalização Laser',
															)
														}
														className="font-bold text-white hover:text-violet-400 text-sm"
													>
														{post.author}
													</button>
													<p className="text-xs text-slate-500 flex items-center gap-1">
														<Clock className="h-3 w-3" /> {post.time}
													</p>
												</div>
												<button
													type="button"
													className="p-2 text-slate-500 hover:text-white rounded-full"
												>
													<MoreVertical className="h-4 w-4" />
												</button>
											</div>
										</div>
									</div>
									<div className="px-4 pb-4">
										<p className="text-sm text-slate-300 leading-relaxed">
											{post.content}
										</p>
										{post.image && (
											<div className="mt-4 rounded-xl overflow-hidden max-h-[400px]">
												<img
													src={post.image}
													alt="Post"
													className="w-full h-full object-cover"
												/>
											</div>
										)}
									</div>
									<div className="border-t border-white/10 p-3 flex gap-2">
										<button
											type="button"
											className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm ${
												post.liked
													? 'text-pink-500'
													: 'text-slate-400 hover:text-white'
											}`}
										>
											<Heart
												className={`h-4 w-4 ${post.liked ? 'fill-pink-500' : ''}`}
											/>
											{post.likes}
										</button>
										<button
											type="button"
											className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
										>
											<MessageSquare className="h-4 w-4" />
											{post.comments}
										</button>
										<button
											type="button"
											className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
										>
											<Send className="h-4 w-4" />
											{post.shares}
										</button>
									</div>
								</div>
							))
						)}
					</div>
				);

			case 'ranking':
				return (
					<div className="w-full p-6 space-y-8">
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
								<Trophy className="h-8 w-8 text-white" />
							</div>
							<h2 className="text-3xl font-bold text-white">
								Ranking da Comunidade
							</h2>
							<p className="text-slate-400 mt-2">
								Os profissionais mais engajados
							</p>
							<div className="flex justify-center gap-2 mt-4">
								<button
									type="button"
									onClick={() => setRankingPeriod('week')}
									className={`px-4 py-2 rounded-full text-sm font-medium ${
										rankingPeriod === 'week'
											? 'bg-violet-600 text-white'
											: 'bg-white/5 text-slate-400 hover:text-white'
									}`}
								>
									Semana
								</button>
								<button
									type="button"
									onClick={() => setRankingPeriod('month')}
									className={`px-4 py-2 rounded-full text-sm font-medium ${
										rankingPeriod === 'month'
											? 'bg-violet-600 text-white'
											: 'bg-white/5 text-slate-400 hover:text-white'
									}`}
								>
									Mês
								</button>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
							{rankingTop.map((user) => (
								<button
									key={user.pos}
									type="button"
									onClick={() =>
										handleViewProfile(user.name, user.name[0], 'Top Performer')
									}
									className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden text-left hover:border-violet-500/40 transition-all ${
										user.pos === 1
											? 'md:-mt-6 z-10 ring-2 ring-amber-500/50'
											: ''
									}`}
								>
									<div
										className={`h-28 bg-gradient-to-br ${getRankingGradient(user.pos)} flex items-center justify-center`}
									>
										<Trophy className="h-14 w-14 text-white drop-shadow-lg" />
									</div>
									<div className="text-center p-6 -mt-14 relative">
										<div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white border-4 border-[#0d0b1e] mb-4">
											{user.name[0]}
										</div>
										<h3 className="font-bold text-lg text-white">
											{user.name}
										</h3>
										<span className="inline-block mt-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-medium">
											{user.pts} pontos
										</span>
									</div>
								</button>
							))}
						</div>

						<div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
							<div className="p-4 border-b border-white/10">
								<h3 className="font-bold text-white flex items-center gap-2">
									<Star className="h-5 w-5 text-cyan-500" />
									Classificação Geral
								</h3>
							</div>
							<div className="p-4 space-y-4">
								{rankingRest.map((u) => (
									<button
										key={u.pos}
										type="button"
										onClick={() =>
											handleViewProfile(u.name, `U${u.pos}`, 'Membro Ativo')
										}
										className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left"
									>
										<span className="font-mono font-bold text-slate-500 w-8">
											{u.pos}º
										</span>
										<div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
											U{u.pos}
										</div>
										<div className="flex-1">
											<p className="font-medium text-white">{u.name}</p>
											<div className="h-2 bg-slate-800 rounded-full mt-2 max-w-[200px] overflow-hidden">
												<div
													className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
													style={{ width: `${100 - u.pos * 5}%` }}
												/>
											</div>
										</div>
										<span className="text-slate-400 text-sm">{u.pts} pts</span>
									</button>
								))}
							</div>
						</div>
					</div>
				);

			case 'events':
				return (
					<div className="w-full p-6 space-y-6">
						<div className="flex justify-between items-center">
							<div>
								<h2 className="text-2xl font-bold text-white flex items-center gap-3">
									<div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
										<Calendar className="h-6 w-6 text-white" />
									</div>
									Agenda de Eventos
								</h2>
								<p className="text-slate-400 mt-1">
									Lives, workshops e treinamentos exclusivos
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowCalendarModal(true)}
								className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full"
							>
								<Calendar className="h-4 w-4" /> Ver Calendário
							</button>
						</div>

						<div className="space-y-6">
							{events.slice(0, 2).map((event) => (
								<div
									key={event.id}
									className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden border-l-4 border-l-cyan-500"
								>
									<div className="md:flex">
										<div className="md:w-64 p-8 bg-violet-500/10 flex flex-col items-center justify-center text-center">
											<span className="text-sm font-bold text-violet-400 uppercase">
												{event.date}
											</span>
											<span className="text-2xl font-bold text-white mt-1">
												{event.time ?? '—'}
											</span>
											<span
												className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
													event.type === 'live'
														? 'bg-red-500/20 text-red-400'
														: 'bg-blue-500/20 text-blue-400'
												}`}
											>
												{event.type === 'live' ? 'AO VIVO' : 'WORKSHOP'}
											</span>
										</div>
										<div className="p-8 flex-1">
											<h3 className="text-xl font-bold text-white mb-2">
												{event.title}
											</h3>
											<p className="text-slate-400 mb-4">
												{event.description ?? ''}
											</p>
											<button
												type="button"
												className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full"
											>
												<Video className="h-4 w-4" /> Entrar na Sala de Espera
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				);

			case 'members':
				return (
					<div className="w-full p-6 space-y-6">
						<div className="flex gap-4 flex-wrap">
							<div className="relative flex-1 min-w-[200px]">
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
								<input
									type="text"
									placeholder="Buscar membro por nome ou especialidade..."
									value={memberSearch}
									onChange={(e) => setMemberSearch(e.target.value)}
									className="w-full pl-12 h-12 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
								/>
							</div>
							<select
								value={memberFilter}
								onChange={(e) => setMemberFilter(e.target.value)}
								className="h-12 px-4 rounded-full bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
							>
								<option value="all">Todos</option>
								<option value="fiber">Fiber</option>
								<option value="uv">UV</option>
								<option value="design">Design</option>
								<option value="brindes">Brindes</option>
								<option value="negocios">Negócios</option>
								<option value="tecnico">Técnico</option>
							</select>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredMembers.length > 0 ? (
								filteredMembers.map((member) => (
									<div
										key={`${member.name}-${member.specialty}`}
										className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 transition-all"
									>
										<div className="flex flex-col items-center">
											<div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mb-4 overflow-hidden">
												{member.image ? (
													<img
														src={member.image}
														alt=""
														className="w-full h-full object-cover"
													/>
												) : (
													member.name[0]
												)}
											</div>
											<h3 className="font-bold text-lg text-white">
												{member.name}
											</h3>
											<p className="text-sm text-slate-400 mb-3 text-center">
												{member.specialty ?? 'Membro da comunidade'}
											</p>
											<div className="flex justify-center gap-2 mb-4 flex-wrap">
												{member.badges.map((badge) => (
													<span
														key={badge}
														className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs"
													>
														{badge}
													</span>
												))}
											</div>
										</div>
										<button
											type="button"
											onClick={() =>
												handleViewProfile(
													member.name,
													member.name[0],
													member.specialty ?? 'Membro da comunidade',
													member.image ?? undefined,
												)
											}
											className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full"
										>
											<Eye className="h-4 w-4" /> Ver Perfil
										</button>
									</div>
								))
							) : (
								<div className="col-span-full text-center py-12">
									<Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
									<p className="text-slate-400">
										Nenhum membro encontrado com esses filtros.
									</p>
								</div>
							)}
						</div>
					</div>
				);

			case 'showcase':
				return (
					<div className="w-full p-6 space-y-6">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
							<div>
								<h2 className="text-2xl font-bold text-white flex items-center gap-3">
									<div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
										<Star className="h-6 w-6 text-white" />
									</div>
									Vitrine de Projetos
								</h2>
								<p className="text-slate-400 mt-1">
									Projetos incríveis da comunidade
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowSubmitProjectModal(true)}
								className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium rounded-full"
							>
								<UploadIcon className="h-4 w-4" /> Enviar Projeto
							</button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{projects.map((item) => (
								<button
									key={`${item.title}-${item.author}`}
									type="button"
									onClick={() => handleViewDetails(item)}
									className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden text-left hover:border-violet-500/40 transition-all group"
								>
									<div className="aspect-square overflow-hidden">
										<img
											src={
												item.img ??
												'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2940&auto=format&fit=crop'
											}
											alt={item.title}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform"
										/>
									</div>
									<div className="p-5">
										<h3 className="font-bold text-lg text-white mb-1">
											{item.title}
										</h3>
										<p className="text-sm text-slate-400 mb-3">
											por {item.author}
										</p>
										<div className="flex gap-2 mb-4 flex-wrap">
											{item.material && (
												<span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs">
													{item.material}
												</span>
											)}
											{item.technique && (
												<span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
													{item.technique}
												</span>
											)}
										</div>
										<div className="flex items-center gap-4 text-sm text-slate-400">
											<span className="flex items-center gap-1">
												<Heart className="h-4 w-4 text-pink-400" />{' '}
												{item.likes ?? 0}
											</span>
											<span className="flex items-center gap-1">
												<MessageSquare className="h-4 w-4 text-blue-400" />{' '}
												{item.comments ?? 0}
											</span>
										</div>
										<div className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full">
											<Eye className="h-4 w-4" /> Ver Detalhes
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				);

			case 'channel':
				return (
					<div className="flex flex-col h-full">
						<div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0b1e]/80 backdrop-blur-lg sticky top-0 z-10">
							<div className="flex items-center gap-4">
								<div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
									<Hash className="h-5 w-5 text-white" />
								</div>
								<div>
									<h2 className="font-bold text-lg text-white">
										{activeChannelLabel}
									</h2>
									<p className="text-xs text-slate-500">
										Canal de discussão - Profissão Laser
									</p>
								</div>
							</div>
							<div className="flex -space-x-3">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-[#0d0b1e] flex items-center justify-center text-xs font-bold text-white"
									>
										U{i}
									</div>
								))}
								<div className="w-9 h-9 rounded-full bg-cyan-500/50 border-2 border-[#0d0b1e] flex items-center justify-center text-[10px] font-bold text-white">
									+15
								</div>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto p-6 space-y-6">
							{activeChannel && channelMessages.length > 0 ? (
								channelMessages.map((msg) => (
									<div
										key={msg.id}
										className={`flex gap-4 ${msg.isMe ? 'flex-row-reverse' : ''}`}
									>
										<div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
											{msg.avatar ?? msg.user.substring(0, 2).toUpperCase()}
										</div>
										<div
											className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[75%]`}
										>
											<div className="flex items-baseline gap-2 mb-1">
												<span className="text-sm font-bold text-white">
													{msg.user}
												</span>
												<span className="text-[10px] text-slate-500">
													{formatMessageTime(msg.time)}
												</span>
											</div>
											<div
												className={`p-4 rounded-2xl text-sm ${
													msg.isMe
														? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
														: 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
												}`}
											>
												{msg.content}
											</div>
										</div>
									</div>
								))
							) : (
								<div className="flex flex-col items-center justify-center h-64 text-center">
									<div className="p-6 rounded-full bg-cyan-500/20 mb-4">
										<MessageSquare className="h-12 w-12 text-cyan-400" />
									</div>
									<p className="text-slate-400">
										Seja o primeiro a enviar uma mensagem!
									</p>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						<div className="p-4 border-t border-white/10 bg-[#0d0b1e]/80 backdrop-blur-lg">
							<div className="flex gap-3">
								<button
									type="button"
									className="p-3 text-cyan-400 hover:bg-white/5 rounded-full"
								>
									<Plus className="h-5 w-5" />
								</button>
								<input
									type="text"
									placeholder={`Enviar mensagem em #${activeChannelLabel}...`}
									value={messageInput}
									onChange={(e) => setMessageInput(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
									className="flex-1 h-12 px-6 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
								/>
								<button
									type="button"
									onClick={handleSendMessage}
									disabled={!messageInput.trim()}
									className="h-12 w-12 flex items-center justify-center bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-full"
								>
									<Send className="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	const ModalOverlay = ({
		onClose,
		children,
	}: {
		onClose: () => void;
		children: React.ReactNode;
	}) => (
		// biome-ignore lint/a11y/useSemanticElements: backdrop não pode ser <button> pois contém modal com botões (HTML inválido)
		<div
			role="button"
			tabIndex={0}
			aria-label="Fechar modal"
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
			onClick={onClose}
			onKeyDown={(e) => e.key === 'Escape' && onClose()}
		>
			<div
				role="dialog"
				className="bg-white dark:bg-[#12103a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.key === 'Escape' && onClose()}
			>
				{children}
			</div>
		</div>
	);

	return (
		<div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0d0b1e]">
			{/* Modals */}
			{showProfileModal && selectedProfile && (
				<ModalOverlay onClose={() => setShowProfileModal(false)}>
					<div className="p-6">
						<div className="h-32 -m-6 mb-0 rounded-t-2xl bg-gradient-to-br from-violet-600 to-purple-600" />
						<div className="flex flex-col items-center -mt-16">
							<div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-[#12103a]">
								{selectedProfile.avatar}
							</div>
							<h3 className="text-2xl font-bold text-white mt-4">
								{selectedProfile.name}
							</h3>
							<p className="text-violet-400 font-medium">
								{selectedProfile.specialty}
							</p>
						</div>
						<div className="flex justify-center gap-6 py-6 border-y border-white/10">
							<div className="text-center">
								<p className="text-2xl font-bold text-white">127</p>
								<p className="text-xs text-slate-500">Projetos</p>
							</div>
							<div className="w-px h-12 bg-white/10" />
							<div className="text-center">
								<p className="text-2xl font-bold text-white">2.4k</p>
								<p className="text-xs text-slate-500">Seguidores</p>
							</div>
							<div className="w-px h-12 bg-white/10" />
							<div className="text-center">
								<p className="text-2xl font-bold text-white">89</p>
								<p className="text-xs text-slate-500">Seguindo</p>
							</div>
						</div>
						<div className="flex gap-2 justify-center flex-wrap py-4">
							<span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm">
								Laser UV
							</span>
							<span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm">
								Fiber
							</span>
							<span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm">
								Personalização
							</span>
						</div>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setShowProfileModal(false)}
								className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/10 rounded-full text-slate-300 hover:bg-white/5"
							>
								<MessageSquare className="h-4 w-4" /> Mensagem
							</button>
							<button
								type="button"
								className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full"
							>
								<Users className="h-4 w-4" /> Seguir
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}

			{showDetailsModal && selectedProject && (
				<ModalOverlay onClose={() => setShowDetailsModal(false)}>
					<div className="p-6">
						<h3 className="text-2xl font-bold text-white">
							{selectedProject.title}
						</h3>
						<p className="text-violet-400">por {selectedProject.author}</p>
						{selectedProject.img && (
							<div className="rounded-xl overflow-hidden mt-4">
								<img
									src={selectedProject.img}
									alt={selectedProject.title}
									className="w-full h-64 object-cover"
								/>
							</div>
						)}
						<p className="text-slate-400 mt-4 leading-relaxed">
							{selectedProject.description}
						</p>
						<div className="grid grid-cols-3 gap-4 p-4 bg-violet-500/10 rounded-xl mt-4">
							<div className="text-center">
								<p className="text-xs text-slate-500">Material</p>
								<p className="font-medium text-white text-sm">
									{selectedProject.material ?? '-'}
								</p>
							</div>
							<div className="text-center">
								<p className="text-xs text-slate-500">Técnica</p>
								<p className="font-medium text-white text-sm">
									{selectedProject.technique ?? '-'}
								</p>
							</div>
							<div className="text-center">
								<p className="text-xs text-slate-500">Tempo</p>
								<p className="font-medium text-white text-sm">
									{selectedProject.time ?? '-'}
								</p>
							</div>
						</div>
						<div className="flex gap-4 pt-4 border-t border-white/10 mt-4">
							<button
								type="button"
								className="flex items-center gap-2 text-slate-400 hover:text-pink-500"
							>
								<Heart className="h-5 w-5" /> {selectedProject.likes ?? 234}{' '}
								curtidas
							</button>
							<button
								type="button"
								className="flex items-center gap-2 text-slate-400 hover:text-blue-500"
							>
								<MessageSquare className="h-5 w-5" />{' '}
								{selectedProject.comments ?? 45} comentários
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}

			{showCreateChannelModal && (
				<ModalOverlay onClose={() => setShowCreateChannelModal(false)}>
					<div className="p-6">
						<div className="mx-auto w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
							<Hash className="h-8 w-8 text-violet-400" />
						</div>
						<h3 className="text-2xl font-bold text-white text-center">
							Criar Novo Canal
						</h3>
						<p className="text-slate-400 text-center mt-1">
							Crie um espaço para discussões sobre personalização laser
						</p>
						<div className="mt-6 space-y-2">
							<label
								htmlFor="channel-name"
								className="text-sm font-medium text-white"
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
									className="w-full pl-8 h-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
								/>
							</div>
						</div>
						<button
							type="button"
							onClick={handleCreateChannel}
							disabled={!newChannelName.trim()}
							className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-full"
						>
							<Sparkles className="h-4 w-4" /> Criar Canal
						</button>
					</div>
				</ModalOverlay>
			)}

			{showSubmitProjectModal && (
				<ModalOverlay onClose={() => setShowSubmitProjectModal(false)}>
					<div className="p-6">
						<div className="mx-auto w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
							<Star className="h-8 w-8 text-pink-400" />
						</div>
						<h3 className="text-2xl font-bold text-white text-center">
							Enviar Projeto
						</h3>
						<p className="text-slate-400 text-center mt-1">
							Compartilhe seu trabalho de personalização a laser
						</p>
						<div className="mt-6 space-y-4">
							<div>
								<label
									htmlFor="project-image"
									className="text-sm font-medium text-white block mb-2"
								>
									Imagem do Projeto
								</label>
								<input
									id="project-image"
									type="file"
									ref={projectFileInputRef}
									onChange={handleProjectImageUpload}
									accept="image/*"
									className="hidden"
								/>
								{newProject.image ? (
									<div className="relative rounded-xl overflow-hidden">
										<img
											src={newProject.image}
											alt="Preview"
											className="w-full h-48 object-cover rounded-xl"
										/>
										<button
											type="button"
											onClick={() =>
												setNewProject((p) => ({ ...p, image: null }))
											}
											className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => projectFileInputRef.current?.click()}
										className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-violet-500/50 hover:bg-violet-500/10 transition-colors"
									>
										<ImageIcon className="h-10 w-10 text-violet-400 mx-auto mb-2" />
										<p className="text-sm text-slate-400">
											Clique para adicionar uma imagem
										</p>
									</button>
								)}
							</div>
							<div>
								<label
									htmlFor="project-title"
									className="text-sm font-medium text-white block mb-2"
								>
									Título do Projeto
								</label>
								<input
									id="project-title"
									type="text"
									placeholder="Ex: Canecas Personalizadas Premium"
									value={newProject.title}
									onChange={(e) =>
										setNewProject((p) => ({ ...p, title: e.target.value }))
									}
									className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 px-4"
								/>
							</div>
							<div>
								<label
									htmlFor="project-description"
									className="text-sm font-medium text-white block mb-2"
								>
									Descrição
								</label>
								<textarea
									id="project-description"
									placeholder="Descreva seu projeto de personalização..."
									value={newProject.description}
									onChange={(e) =>
										setNewProject((p) => ({
											...p,
											description: e.target.value,
										}))
									}
									className="w-full min-h-[80px] rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 p-4 resize-none"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="project-material"
										className="text-sm font-medium text-white block mb-2"
									>
										Material
									</label>
									<input
										id="project-material"
										type="text"
										placeholder="Ex: Caneca cerâmica"
										value={newProject.material}
										onChange={(e) =>
											setNewProject((p) => ({ ...p, material: e.target.value }))
										}
										className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 px-4"
									/>
								</div>
								<div>
									<label
										htmlFor="project-technique"
										className="text-sm font-medium text-white block mb-2"
									>
										Técnica
									</label>
									<input
										id="project-technique"
										type="text"
										placeholder="Ex: UV Laser"
										value={newProject.technique}
										onChange={(e) =>
											setNewProject((p) => ({
												...p,
												technique: e.target.value,
											}))
										}
										className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 px-4"
									/>
								</div>
							</div>
						</div>
						<button
							type="button"
							onClick={handleSubmitProject}
							disabled={
								!newProject.title.trim() || !newProject.description.trim()
							}
							className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium rounded-full"
						>
							<UploadIcon className="h-4 w-4" /> Enviar Projeto
						</button>
					</div>
				</ModalOverlay>
			)}

			{showCalendarModal && (
				<ModalOverlay onClose={() => setShowCalendarModal(false)}>
					<div className="p-6">
						<h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
							<Calendar className="h-6 w-6 text-violet-500" />
							Calendário de Eventos
						</h3>
						<p className="text-violet-400 mb-6">
							Workshops, lives e eventos sobre personalização a laser
						</p>
						<div className="p-6 bg-violet-500/10 rounded-2xl border border-white/10 mb-6">
							<div className="flex items-center justify-between mb-4">
								<h4 className="font-bold text-lg text-white">Janeiro 2025</h4>
								<div className="flex gap-2">
									<button
										type="button"
										className="p-2 text-violet-400 hover:bg-white/5 rounded-lg"
									>
										<ArrowLeft className="h-4 w-4" />
									</button>
									<button
										type="button"
										className="p-2 text-violet-400 hover:bg-white/5 rounded-lg"
									>
										<ArrowLeft className="h-4 w-4 rotate-180" />
									</button>
								</div>
							</div>
							<div className="grid grid-cols-7 gap-2 text-center mb-2">
								{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
									<div
										key={d}
										className="text-xs font-medium text-violet-400 py-2"
									>
										{d}
									</div>
								))}
							</div>
							<div className="grid grid-cols-7 gap-2">
								{Array.from({ length: 35 }, (_, i) => {
									const day = i - 2;
									const isCurrentMonth = day > 0 && day <= 31;
									const hasEvent = [15, 18, 22].includes(day);
									return (
										<button
											// biome-ignore lint/suspicious/noArrayIndexKey: calendário estático, ordem fixa
											key={i}
											type="button"
											className={`aspect-square p-2 rounded-lg text-sm font-medium ${
												!isCurrentMonth ? 'text-slate-600' : 'text-white'
											} ${hasEvent ? 'bg-violet-600 text-white' : 'hover:bg-white/10'}`}
										>
											{isCurrentMonth ? day : ''}
										</button>
									);
								})}
							</div>
						</div>
						<div className="space-y-3">
							<h4 className="font-bold text-white">Próximos Eventos</h4>
							{events.map((event) => (
								<div
									key={event.id}
									className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/40 transition-colors"
								>
									<div className="flex gap-3">
										<div className="w-14 h-14 rounded-xl bg-violet-600 flex flex-col items-center justify-center text-white shrink-0">
											<span className="text-xs">
												{event.date.split(' ')[1]}
											</span>
											<span className="text-lg font-bold">
												{event.date.split(' ')[0]}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<h5 className="font-semibold text-white text-sm">
												{event.title}
											</h5>
											<p className="text-xs text-slate-400 mt-1">
												{event.description}
											</p>
											<div className="flex items-center gap-2 text-xs text-violet-400 mt-2">
												<Clock className="h-3 w-3" />
												{event.time ?? event.date}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</ModalOverlay>
			)}

			{/* Header */}
			<header className="border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0d0b1e]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={onBack}
						className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-violet-600 dark:text-violet-400"
					>
						<ArrowLeft className="h-5 w-5" />
					</button>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
							<Sparkles className="h-6 w-6 text-white" />
						</div>
						<div>
							<h2 className="font-bold text-xl bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
								Comunidade VIP
							</h2>
							<p className="text-xs text-violet-600 dark:text-violet-400">
								Profissão Laser - Personalização Profissional
							</p>
						</div>
					</div>
				</div>

				<div className="flex-1 max-w-xl mx-8">
					<div className="relative">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-400" />
						<input
							type="text"
							placeholder="Buscar na comunidade..."
							className="w-full pl-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
						/>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<ThemeToggle />
					<button
						type="button"
						className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-violet-600 dark:text-violet-400 relative"
					>
						<MessageSquare className="h-5 w-5" />
						<span className="absolute top-2 right-2 w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse ring-2 ring-slate-50 dark:ring-[#0d0b1e]" />
					</button>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<aside className="w-80 border-r border-slate-200 dark:border-white/10 p-4 space-y-6 overflow-y-auto bg-white/50 dark:bg-[#0d0b1e]/60 shrink-0">
					<div className="space-y-2">
						{[
							{ id: 'feed', label: 'Feed Principal', icon: Home },
							{ id: 'ranking', label: 'Ranking & Conquistas', icon: Trophy },
							{ id: 'events', label: 'Eventos & Lives', icon: Video },
							{ id: 'members', label: 'Membros', icon: Users },
							{ id: 'showcase', label: 'Vitrine de Projetos', icon: Star },
						].map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => setActiveTab(item.id)}
								className={`w-full flex items-center gap-3 h-12 px-4 rounded-xl text-sm font-medium transition-all ${
									activeTab === item.id
										? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
										: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								<div
									className={`w-8 h-8 rounded-lg flex items-center justify-center ${
										activeTab === item.id
											? 'bg-violet-600'
											: 'bg-slate-200 dark:bg-white/10'
									}`}
								>
									<item.icon
										className={`h-4 w-4 ${activeTab === item.id ? 'text-white' : 'text-violet-600 dark:text-violet-400'}`}
									/>
								</div>
								{item.label}
							</button>
						))}
					</div>

					<div className="border-t border-white/10 pt-4">
						<h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider px-4 mb-3 flex items-center gap-2">
							<Calendar className="h-3.5 w-3.5" />
							Eventos
						</h4>
						<button
							type="button"
							onClick={() => setShowCalendarModal(true)}
							className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-violet-400 hover:bg-white/5 rounded-xl"
						>
							<Calendar className="h-4 w-4" />
							Ver Calendário
						</button>
						<div className="space-y-2 mt-4">
							{events.slice(0, 2).map((event) => (
								<button
									key={event.id}
									type="button"
									onClick={() => setShowCalendarModal(true)}
									className="w-full p-3 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/40 text-left"
								>
									<div className="flex gap-2">
										<div className="w-10 h-10 rounded-lg bg-violet-600 flex flex-col items-center justify-center text-white text-xs shrink-0">
											<span className="text-[10px]">
												{event.date.split(' ')[1]}
											</span>
											<span className="text-sm font-bold">
												{event.date.split(' ')[0]}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<h5 className="font-semibold text-white text-xs truncate">
												{event.title}
											</h5>
											<div className="flex items-center gap-1 text-[10px] text-violet-400 mt-1">
												<Clock className="h-2.5 w-2.5" />
												{event.time ?? event.date}
											</div>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>

					<div className="pt-4">
						<div className="flex items-center justify-between px-4 mb-3">
							<h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
								Canais
							</h4>
							<button
								type="button"
								onClick={() => setShowCreateChannelModal(true)}
								className="p-1.5 hover:bg-white/5 rounded-full text-violet-400"
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>
						<div className="space-y-1">
							{channelCategories.length > 0 ? (
								channelCategories.map((category) => (
									<div key={category.name} className="space-y-1">
										<div className="px-4 py-2">
											<h5 className="text-[10px] font-bold text-violet-500 uppercase">
												{category.name}
											</h5>
										</div>
										{category.channels.map((channel) => {
											const isActive =
												activeTab === 'channel' && activeChannel === channel.id;
											const IconComponent = getChannelIcon(channel);
											return (
												<button
													key={channel.id}
													type="button"
													onClick={() => handleChannelClick(channel.id)}
													title={channel.description ?? undefined}
													className={`w-full flex items-center gap-2 h-10 px-4 rounded-xl text-sm transition-all ${
														isActive
															? 'bg-violet-500/20 text-violet-300'
															: 'text-slate-400 hover:text-white hover:bg-white/5'
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
				</aside>

				{/* Main content */}
				<main className="flex-1 overflow-y-auto">
					{activeTab !== 'channel' ? (
						<div className="overflow-y-auto h-full">{renderContent()}</div>
					) : (
						renderContent()
					)}
				</main>

				{/* Right sidebar - Feed only */}
				{activeTab === 'feed' && (
					<aside className="hidden xl:block w-80 border-l border-slate-200 dark:border-white/10 p-6 space-y-6 overflow-y-auto bg-white/50 dark:bg-[#0d0b1e]/60">
						<div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
							<div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
							<div className="p-4">
								<h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
									<Trophy className="h-4 w-4" />
									Top da Semana
								</h4>
								<div className="space-y-4 mt-4">
									{[1, 2, 3].map((i) => (
										<button
											key={i}
											type="button"
											onClick={() =>
												handleViewProfile(
													`Usuário Top ${i}`,
													`T${i}`,
													'Top Performer',
												)
											}
											className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
										>
											<div
												className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
													i === 1
														? 'bg-amber-500 text-white'
														: 'bg-slate-600 text-slate-300'
												}`}
											>
												{i}º
											</div>
											<div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
												U{i}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold text-white truncate">
													Usuário Exemplo
												</p>
												<p className="text-[10px] text-slate-500">
													{1500 - i * 100} pts
												</p>
											</div>
										</button>
									))}
								</div>
							</div>
						</div>

						<div>
							<h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
								<Calendar className="h-4 w-4 text-violet-500" />
								Próximos Eventos
							</h4>
							<div className="space-y-4">
								{[
									{
										title: 'Live: Personalização UV',
										date: 'Hoje, 19:00',
										type: 'live',
									},
									{
										title: 'Workshop Fiber Laser',
										date: 'Amanhã, 20:00',
										type: 'workshop',
									},
								].map((event) => (
									<button
										key={`${event.title}-${event.date}`}
										type="button"
										onClick={() => setShowCalendarModal(true)}
										className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/40 text-left border-l-4 border-l-violet-500"
									>
										<div className="flex justify-between items-start mb-2">
											<span
												className={`text-[10px] px-2 py-0.5 rounded ${
													event.type === 'live'
														? 'bg-red-500/20 text-red-400'
														: 'bg-blue-500/20 text-blue-400'
												}`}
											>
												{event.type === 'live' ? 'AO VIVO' : 'WORKSHOP'}
											</span>
											<Video className="h-4 w-4 text-slate-500" />
										</div>
										<h5 className="font-bold text-sm text-white">
											{event.title}
										</h5>
										<p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
											<Clock className="h-3 w-3" /> {event.date}
										</p>
									</button>
								))}
							</div>
						</div>

						<div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
							<div className="p-4 bg-gradient-to-br from-violet-600 to-purple-600 text-white">
								<Sparkles className="h-8 w-8 mb-2" />
								<h4 className="font-bold">Dica do Dia</h4>
							</div>
							<div className="p-4">
								<p className="text-sm text-slate-400 leading-relaxed">
									Sempre faça testes de potência antes de gravar em novos
									materiais. Isso evita desperdício e garante qualidade
									profissional!
								</p>
							</div>
						</div>
					</aside>
				)}
			</div>
		</div>
	);
}
