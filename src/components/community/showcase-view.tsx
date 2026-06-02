'use client';

import {
	Eye,
	Heart,
	ImageIcon,
	MessageSquare,
	Search,
	Send,
	Star,
	UploadIcon,
	X,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { ProjectCardsSkeleton } from '@/components/ui/skeletons/community-grid-skeleton';
import {
	useCommunityProjects,
	useCreateProject,
	useCreateProjectComment,
	useProjectComments,
	useToggleProjectLike,
} from '@/hooks/use-community';
import type { Project } from '@/types/community';
import { formatDate, formatMessageTime } from '@/utils/formatDate';

interface ShowcaseViewProps {
	userName: string;
	userInitials: string;
	isAdmin?: boolean;
}

const PROJECTS_PER_PAGE = 12;

export function ShowcaseView({
	userName,
	userInitials: _userInitials,
	isAdmin: _isAdmin = false,
}: ShowcaseViewProps) {
	const [projectPage, setProjectPage] = useState(1);
	const [projectSort, setProjectSort] = useState<'recent' | 'likes'>('recent');
	const [projectMaterialFilter, setProjectMaterialFilter] = useState('');
	const [projectTechniqueFilter, setProjectTechniqueFilter] = useState('');
	const [projectSearch, setProjectSearch] = useState('');
	const [projectCommentInput, setProjectCommentInput] = useState('');
	const [showSubmitProjectModal, setShowSubmitProjectModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [newProject, setNewProject] = useState({
		title: '',
		description: '',
		material: '',
		technique: '',
		image: null as string | null,
	});
	const projectFileInputRef = useRef<HTMLInputElement>(null);

	const { data: projects = [], isLoading: projectsLoading } =
		useCommunityProjects(1, projectPage * PROJECTS_PER_PAGE, {
			material: projectMaterialFilter || undefined,
			technique: projectTechniqueFilter || undefined,
			search: projectSearch.trim() || undefined,
			sort: projectSort,
		});
	const hasMoreProjects = projects.length >= projectPage * PROJECTS_PER_PAGE;

	const uniqueMaterials = useMemo(
		() =>
			Array.from(
				new Set(
					projects
						.map((p) => p.material)
						.filter((m): m is string => !!m?.trim()),
				),
			).sort(),
		[projects],
	);
	const uniqueTechniques = useMemo(
		() =>
			Array.from(
				new Set(
					projects
						.map((p) => p.technique)
						.filter((t): t is string => !!t?.trim()),
				),
			).sort(),
		[projects],
	);

	const createProjectMutation = useCreateProject();
	const { data: projectComments = [] } = useProjectComments(
		selectedProject?.id ?? null,
	);
	const createCommentMutation = useCreateProjectComment(
		selectedProject?.id ?? null,
	);

	const handleViewDetails = (project: Project) => {
		setSelectedProject(project);
		setShowDetailsModal(true);
	};

	const toggleLike = useToggleProjectLike();
	const handleLikeProject = (projectId: string) => toggleLike.mutate(projectId);

	const handleSubmitProject = () => {
		if (!newProject.title.trim() || !newProject.description.trim()) return;
		createProjectMutation.mutate(
			{
				author: userName,
				title: newProject.title.trim(),
				description: newProject.description.trim(),
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

	const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () =>
				setNewProject((prev) => ({ ...prev, image: reader.result as string }));
			reader.readAsDataURL(file);
		}
	};

	const handleAddProjectComment = () => {
		if (!projectCommentInput.trim() || !selectedProject) return;
		createCommentMutation.mutate(
			{ content: projectCommentInput.trim() },
			{
				onSuccess: () => {
					setProjectCommentInput('');
				},
			},
		);
	};

	return (
		<>
			{/* Details Modal */}
			{showDetailsModal &&
				selectedProject &&
				(() => {
					const currentProject =
						projects.find((p) => p.id === selectedProject.id) ??
						selectedProject;
					const comments = projectComments;
					return (
						<ModalOverlay
							onClose={() => {
								setShowDetailsModal(false);
								setProjectCommentInput('');
							}}
						>
							<div className="p-6 max-h-[90vh] overflow-y-auto">
								<h3 className="text-2xl font-bold text-slate-900 dark:text-white">
									{currentProject.title}
								</h3>
								<div className="flex items-center gap-2 mt-1">
									<Avatar
										src={currentProject.authorAvatar}
										name={currentProject.author}
										className="w-6 h-6 text-[10px]"
									/>
									<p className="text-violet-400">por {currentProject.author}</p>
								</div>
								{currentProject.img && (
									<div className="rounded-xl overflow-hidden mt-4 bg-slate-100 dark:bg-[#111]">
										<img
											src={currentProject.img}
											alt={currentProject.title}
											className="w-full max-h-[60vh] object-contain"
										/>
									</div>
								)}
								<p className="text-slate-600 dark:text-gray-400 mt-4 leading-relaxed">
									{currentProject.description}
								</p>
								<div className="grid grid-cols-3 gap-4 p-4 bg-violet-500/10 rounded-xl mt-4">
									<div className="text-center">
										<p className="text-xs text-slate-600 dark:text-gray-500">
											Material
										</p>
										<p className="font-medium text-slate-900 dark:text-white text-sm">
											{currentProject.material ?? '-'}
										</p>
									</div>
									<div className="text-center">
										<p className="text-xs text-slate-600 dark:text-gray-500">
											Tecnica
										</p>
										<p className="font-medium text-slate-900 dark:text-white text-sm">
											{currentProject.technique ?? '-'}
										</p>
									</div>
									<div className="text-center">
										<p className="text-xs text-slate-600 dark:text-gray-500">
											Tempo
										</p>
										<p className="font-medium text-slate-900 dark:text-white text-sm">
											{currentProject.time
												? /^\d{4}-\d{2}-\d{2}T/.test(currentProject.time)
													? formatDate(currentProject.time)
													: currentProject.time
												: '-'}
										</p>
									</div>
								</div>
								<div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-white/10 mt-4">
									<button
										type="button"
										onClick={() => handleLikeProject(selectedProject.id)}
										className={`flex items-center gap-2 ${
											currentProject.liked
												? 'text-pink-500'
												: 'text-slate-600 dark:text-gray-400 hover:text-pink-500'
										}`}
									>
										<Heart
											className={`h-5 w-5 ${
												currentProject.liked ? 'fill-pink-500' : ''
											}`}
										/>{' '}
										{currentProject.likes ?? 0} curtidas
									</button>
									<span className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
										<MessageSquare className="h-5 w-5" />{' '}
										{currentProject.comments ?? 0} comentarios
									</span>
								</div>

								<div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
									<h4 className="font-semibold text-slate-900 dark:text-white mb-4">
										Comentarios
									</h4>
									<div className="space-y-4 max-h-48 overflow-y-auto">
										{comments.length === 0 ? (
											<p className="text-sm text-slate-500 dark:text-gray-400">
												Nenhum comentario ainda. Seja o primeiro!
											</p>
										) : (
											comments.map((c) => (
												<div
													key={c.id}
													className="p-3 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10"
												>
													<div className="flex items-center justify-between mb-1">
														<span className="font-medium text-slate-900 dark:text-white text-sm">
															{c.author}
															{c.isAdmin && (
																<span className="ml-2 text-xs text-violet-400">
																	(Admin)
																</span>
															)}
														</span>
														<span className="text-xs text-slate-500">
															{formatMessageTime(c.time)}
														</span>
													</div>
													<p className="text-sm text-slate-600 dark:text-slate-300">
														{c.content}
													</p>
												</div>
											))
										)}
									</div>
									<div className="flex gap-2 mt-4">
										<input
											type="text"
											placeholder="Escreva um comentario..."
											value={projectCommentInput}
											onChange={(e) => setProjectCommentInput(e.target.value)}
											onKeyDown={(e) =>
												e.key === 'Enter' && handleAddProjectComment()
											}
											className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
										/>
										<button
											type="button"
											onClick={handleAddProjectComment}
											disabled={!projectCommentInput.trim()}
											className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-600 disabled:opacity-50 text-white font-medium flex items-center gap-2"
										>
											<Send className="h-4 w-4" />
											Comentar
										</button>
									</div>
								</div>
							</div>
						</ModalOverlay>
					);
				})()}

			{/* Submit Project Modal */}
			{showSubmitProjectModal && (
				<ModalOverlay onClose={() => setShowSubmitProjectModal(false)}>
					<div className="p-6">
						<div className="mx-auto w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
							<Star className="h-8 w-8 text-pink-400" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
							Enviar Projeto
						</h3>
						<p className="text-slate-600 dark:text-gray-400 text-center mt-1">
							Compartilhe seu trabalho de personalizacao a laser
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
									<div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-[#111]">
										<img
											src={newProject.image}
											alt="Preview"
											className="w-full max-h-56 object-contain rounded-xl"
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
										<p className="text-sm text-slate-600 dark:text-gray-400">
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
									Titulo do Projeto
								</label>
								<input
									id="project-title"
									type="text"
									placeholder="Ex: Canecas Personalizadas Premium"
									value={newProject.title}
									onChange={(e) =>
										setNewProject((p) => ({ ...p, title: e.target.value }))
									}
									className="w-full h-12 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 px-4"
								/>
							</div>
							<div>
								<label
									htmlFor="project-description"
									className="text-sm font-medium text-white block mb-2"
								>
									Descricao
								</label>
								<textarea
									id="project-description"
									placeholder="Descreva seu projeto de personalizacao..."
									value={newProject.description}
									onChange={(e) =>
										setNewProject((p) => ({
											...p,
											description: e.target.value,
										}))
									}
									className="w-full min-h-[80px] rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 p-4 resize-none"
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
										placeholder="Ex: Caneca ceramica"
										value={newProject.material}
										onChange={(e) =>
											setNewProject((p) => ({
												...p,
												material: e.target.value,
											}))
										}
										className="w-full h-10 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 px-4"
									/>
								</div>
								<div>
									<label
										htmlFor="project-technique"
										className="text-sm font-medium text-white block mb-2"
									>
										Tecnica
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
										className="w-full h-10 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 px-4"
									/>
								</div>
							</div>
						</div>
						<button
							type="button"
							onClick={handleSubmitProject}
							disabled={
								!newProject.title.trim() ||
								!newProject.description.trim() ||
								createProjectMutation.isPending
							}
							className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-400 disabled:opacity-50 text-white font-medium rounded-full"
						>
							<UploadIcon className="h-4 w-4" /> Enviar Projeto
						</button>
					</div>
				</ModalOverlay>
			)}

			{/* Main content */}
			<div className="relative w-full p-6 space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-3">
							<div className="p-2 rounded-xl bg-violet-600">
								<Star className="h-6 w-6 text-white" />
							</div>
							Vitrine de Projetos
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Projetos incriveis da comunidade
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowSubmitProjectModal(true)}
						className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-400 text-white font-medium rounded-full"
					>
						<UploadIcon className="h-4 w-4" /> Enviar Projeto
					</button>
				</div>

				{/* Filtros e ordenacao */}
				<div className="flex flex-col sm:flex-row gap-4 flex-wrap">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
						<input
							type="text"
							placeholder="Buscar por titulo ou autor..."
							value={projectSearch}
							onChange={(e) => {
								setProjectSearch(e.target.value);
								setProjectPage(1);
							}}
							className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
						/>
					</div>
					<select
						value={projectMaterialFilter}
						onChange={(e) => {
							setProjectMaterialFilter(e.target.value);
							setProjectPage(1);
						}}
						className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
					>
						<option value="">Todos os materiais</option>
						{uniqueMaterials.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
					<select
						value={projectTechniqueFilter}
						onChange={(e) => {
							setProjectTechniqueFilter(e.target.value);
							setProjectPage(1);
						}}
						className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
					>
						<option value="">Todas as tecnicas</option>
						{uniqueTechniques.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => {
								setProjectSort('recent');
								setProjectPage(1);
							}}
							className={`px-4 py-2 rounded-xl text-sm font-medium ${
								projectSort === 'recent'
									? 'bg-violet-600 text-white'
									: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
							}`}
						>
							Mais recentes
						</button>
						<button
							type="button"
							onClick={() => {
								setProjectSort('likes');
								setProjectPage(1);
							}}
							className={`px-4 py-2 rounded-xl text-sm font-medium ${
								projectSort === 'likes'
									? 'bg-violet-600 text-white'
									: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
							}`}
						>
							Mais curtidos
						</button>
					</div>
				</div>

				{/* Grid de projetos */}
				{projectsLoading ? (
					<div className="flex justify-center py-16">
						<div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
					</div>
				) : projects.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<Star className="h-16 w-16 text-slate-400 dark:text-gray-500 mb-4 opacity-50" />
						<p className="text-lg font-medium text-slate-600 dark:text-gray-400">
							Nenhum projeto ainda
						</p>
						<p className="text-sm text-slate-500 dark:text-gray-500 mt-1">
							Seja o primeiro a compartilhar seu trabalho!
						</p>
						<button
							type="button"
							onClick={() => setShowSubmitProjectModal(true)}
							className="mt-6 flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-400 text-white font-medium rounded-full"
						>
							<UploadIcon className="h-4 w-4" /> Enviar Projeto
						</button>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{projectsLoading && projects.length === 0 ? (
								<ProjectCardsSkeleton />
							) : (
								projects.map((item) => (
									// biome-ignore lint/a11y/useSemanticElements: div needed because it contains inner button (like)
									<div
										key={item.id}
										role="button"
										tabIndex={0}
										onClick={() => handleViewDetails(item)}
										onKeyDown={(e) =>
											e.key === 'Enter' && handleViewDetails(item)
										}
										className="bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden text-left hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 group cursor-pointer"
									>
										<div className="aspect-square overflow-hidden bg-slate-100 dark:bg-[#111]">
											<img
												src={
													item.img ??
													'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2940&auto=format&fit=crop'
												}
												alt={item.title}
												className="w-full h-full object-contain group-hover:scale-105 transition-transform"
											/>
										</div>
										<div className="p-5">
											<h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
												{item.title}
											</h3>
											<div className="flex items-center gap-2 mb-3">
												<Avatar
													src={item.authorAvatar}
													name={item.author}
													className="w-5 h-5 text-[9px]"
												/>
												<p className="text-sm text-slate-600 dark:text-gray-400">
													por {item.author}
												</p>
											</div>
											<div className="flex gap-2 mb-4 flex-wrap">
												{item.material && (
													<span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs">
														{item.material}
													</span>
												)}
												{item.technique && (
													<span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs">
														{item.technique}
													</span>
												)}
											</div>
											<div className="flex items-center gap-4 text-sm text-slate-600 dark:text-gray-400">
												<button
													type="button"
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														handleLikeProject(item.id);
													}}
													className="flex items-center gap-1 hover:text-pink-500"
												>
													<Heart
														className={`h-4 w-4 ${
															item.liked
																? 'fill-pink-500 text-pink-500'
																: 'text-pink-400'
														}`}
													/>{' '}
													{item.likes ?? 0}
												</button>
												<span className="flex items-center gap-1">
													<MessageSquare className="h-4 w-4 text-blue-400" />{' '}
													{item.comments ?? 0}
												</span>
											</div>
											<div className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-600 text-white font-medium rounded-full">
												<Eye className="h-4 w-4" /> Ver Detalhes
											</div>
										</div>
									</div>
								))
							)}
						</div>
						{hasMoreProjects && (
							<div className="flex justify-center pt-4">
								<button
									type="button"
									onClick={() => setProjectPage((p) => p + 1)}
									className="px-6 py-2 rounded-full border border-violet-500/50 text-violet-600 hover:bg-violet-500/10 font-medium"
								>
									Carregar mais
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</>
	);
}
