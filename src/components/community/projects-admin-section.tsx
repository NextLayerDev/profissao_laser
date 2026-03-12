'use client';

import {
	ImageIcon,
	Loader2,
	MessageSquare,
	Pencil,
	Send,
	Star,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
	useCommunityProjects,
	useCreateProjectComment,
	useDeleteProject,
	useProjectComments,
	useUpdateProject,
} from '@/hooks/use-community';
import type { Project } from '@/types/community';
import { formatMessageTime } from '@/utils/formatDate';

interface ProjectFormData {
	title: string;
	description: string;
	material: string;
	technique: string;
	img: string;
}

const emptyForm: ProjectFormData = {
	title: '',
	description: '',
	material: '',
	technique: '',
	img: '',
};

export function ProjectsAdminSection() {
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | null>(null);
	const [form, setForm] = useState<ProjectFormData>(emptyForm);
	const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);
	const [expandedComments, setExpandedComments] = useState<string | null>(null);
	const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
		{},
	);

	const { data: projects = [], isLoading: projectsLoading } =
		useCommunityProjects(1, 100);
	const { data: projectComments = [] } = useProjectComments(expandedComments);
	const createCommentMutation = useCreateProjectComment(expandedComments);
	const updateMutation = useUpdateProject();
	const deleteMutation = useDeleteProject();

	const handleOpenEdit = (project: Project) => {
		setEditingProject(project);
		setForm({
			title: project.title,
			description: project.description ?? '',
			material: project.material ?? '',
			technique: project.technique ?? '',
			img: project.img ?? '',
		});
		setShowEditModal(true);
	};

	const handleCloseEditModal = () => {
		setShowEditModal(false);
		setEditingProject(null);
		setForm(emptyForm);
	};

	const handleSubmitEdit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title.trim() || !editingProject) return;
		updateMutation.mutate(
			{
				projectId: editingProject.id,
				data: {
					title: form.title.trim(),
					description: form.description.trim() || undefined,
					material: form.material.trim() || undefined,
					technique: form.technique.trim() || undefined,
					img: form.img.trim() || undefined,
				},
			},
			{ onSuccess: handleCloseEditModal },
		);
	};

	const handleDelete = (project: Project) => {
		deleteMutation.mutate(project.id, {
			onSuccess: () => setDeleteConfirm(null),
		});
	};

	const handleAddComment = (projectId: string) => {
		const content = commentInputs[projectId]?.trim();
		if (!content) return;
		createCommentMutation.mutate(
			{ content },
			{
				onSuccess: () => {
					setCommentInputs((prev) => ({ ...prev, [projectId]: '' }));
				},
			},
		);
	};

	const toggleComments = (projectId: string) => {
		setExpandedComments((prev) => (prev === projectId ? null : projectId));
	};

	return (
		<div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-semibold text-slate-900 dark:text-white">
					Vitrine de Projetos
				</h3>
			</div>

			<div className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800">
				{projectsLoading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
					</div>
				) : projects.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-gray-400">
						<Star className="h-16 w-16 mb-4 opacity-50" />
						<p className="font-medium">Nenhum projeto ainda</p>
						<p className="text-sm mt-1">
							Os projetos enviados pela comunidade aparecerão aqui
						</p>
					</div>
				) : (
					<div className="p-4 space-y-3">
						{projects.map((project) => {
							const isExpanded = expandedComments === project.id;
							const comments =
								isExpanded && expandedComments === project.id
									? projectComments
									: [];
							return (
								<div
									key={project.id}
									className="flex gap-4 p-4 bg-slate-50 dark:bg-[#252528] rounded-xl border border-slate-200 dark:border-gray-700"
								>
									<div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-gray-700">
										{project.img ? (
											<img
												src={project.img}
												alt={project.title}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<ImageIcon className="h-8 w-8 text-slate-400" />
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="font-semibold text-slate-900 dark:text-white truncate">
											{project.title}
										</h4>
										<p className="text-sm text-slate-500 dark:text-gray-400">
											por {project.author}
										</p>
										<div className="flex gap-2 mt-1 flex-wrap">
											{project.material && (
												<span className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">
													{project.material}
												</span>
											)}
											{project.technique && (
												<span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
													{project.technique}
												</span>
											)}
										</div>
										{isExpanded && (
											<div className="mt-4 space-y-3">
												<div className="space-y-2 max-h-32 overflow-y-auto">
													{comments.length === 0 ? (
														<p className="text-sm text-slate-500 dark:text-gray-400">
															Nenhum comentário
														</p>
													) : (
														comments.map((c) => (
															<div
																key={c.id}
																className="p-2 rounded-lg bg-slate-100 dark:bg-[#1a1a1d] text-sm"
															>
																<div className="flex justify-between">
																	<span className="font-medium text-slate-900 dark:text-white">
																		{c.author}
																		{c.isAdmin && (
																			<span className="ml-1 text-xs text-violet-400">
																				(Admin)
																			</span>
																		)}
																	</span>
																	<span className="text-xs text-slate-500">
																		{formatMessageTime(c.time)}
																	</span>
																</div>
																<p className="text-slate-600 dark:text-gray-300 mt-0.5">
																	{c.content}
																</p>
															</div>
														))
													)}
												</div>
												<div className="flex gap-2">
													<input
														type="text"
														placeholder="Adicionar comentário como admin..."
														value={commentInputs[project.id] ?? ''}
														onChange={(e) =>
															setCommentInputs((prev) => ({
																...prev,
																[project.id]: e.target.value,
															}))
														}
														onKeyDown={(e) =>
															e.key === 'Enter' && handleAddComment(project.id)
														}
														className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 text-sm"
													/>
													<button
														type="button"
														onClick={() => handleAddComment(project.id)}
														disabled={
															!(commentInputs[project.id]?.trim() ?? '') ||
															createCommentMutation.isPending
														}
														className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-1"
													>
														{createCommentMutation.isPending ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<Send className="h-4 w-4" />
														)}
														Enviar
													</button>
												</div>
											</div>
										)}
									</div>
									<div className="flex flex-col gap-2 shrink-0">
										<button
											type="button"
											onClick={() => toggleComments(project.id)}
											className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-[#1a1a1d] dark:text-gray-400 dark:hover:text-violet-400 flex items-center gap-1"
											title="Ver comentários"
										>
											<MessageSquare className="h-4 w-4" />
											<span className="text-xs">{comments.length}</span>
										</button>
										<button
											type="button"
											onClick={() => handleOpenEdit(project)}
											className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-[#1a1a1d] dark:text-gray-400 dark:hover:text-violet-400"
											title="Editar"
										>
											<Pencil className="h-4 w-4" />
										</button>
										<button
											type="button"
											onClick={() => setDeleteConfirm(project)}
											className="p-2 rounded-lg text-slate-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400"
											title="Remover"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Modal Editar */}
			{showEditModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
					<button
						type="button"
						aria-label="Fechar modal"
						className="absolute inset-0 cursor-default"
						onClick={handleCloseEditModal}
						onKeyDown={(e) => e.key === 'Escape' && handleCloseEditModal()}
					/>
					<form
						onSubmit={handleSubmitEdit}
						className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<div className="mx-auto w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
							<Star className="h-7 w-7 text-violet-500" />
						</div>
						<h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">
							Editar Projeto
						</h3>
						<p className="text-slate-500 dark:text-gray-400 text-center mt-1 text-sm">
							Atualize os dados do projeto
						</p>

						<div className="mt-6 space-y-4">
							<div>
								<label
									htmlFor="project-edit-title"
									className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
								>
									Título *
								</label>
								<input
									id="project-edit-title"
									type="text"
									required
									value={form.title}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											title: e.target.value,
										}))
									}
									placeholder="Título do projeto"
									className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 px-4"
								/>
							</div>
							<div>
								<label
									htmlFor="project-edit-description"
									className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
								>
									Descrição
								</label>
								<textarea
									id="project-edit-description"
									value={form.description}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											description: e.target.value,
										}))
									}
									placeholder="Descrição do projeto"
									rows={3}
									className="w-full rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 px-4 py-3 resize-none"
								/>
							</div>
							<div>
								<label
									htmlFor="project-edit-img"
									className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
								>
									URL da imagem
								</label>
								<input
									id="project-edit-img"
									type="url"
									value={form.img}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											img: e.target.value,
										}))
									}
									placeholder="https://..."
									className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 px-4"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="project-edit-material"
										className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
									>
										Material
									</label>
									<input
										id="project-edit-material"
										type="text"
										value={form.material}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												material: e.target.value,
											}))
										}
										placeholder="Ex: Caneca cerâmica"
										className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 px-4"
									/>
								</div>
								<div>
									<label
										htmlFor="project-edit-technique"
										className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
									>
										Técnica
									</label>
									<input
										id="project-edit-technique"
										type="text"
										value={form.technique}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												technique: e.target.value,
											}))
										}
										placeholder="Ex: UV Laser"
										className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 px-4"
									/>
								</div>
							</div>
						</div>

						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={handleCloseEditModal}
								className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] font-medium"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={!form.title.trim() || updateMutation.isPending}
								className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
							>
								{updateMutation.isPending && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								Guardar
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Modal Confirmar Remoção */}
			{deleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
					<button
						type="button"
						aria-label="Fechar"
						className="absolute inset-0 cursor-default"
						onClick={() => setDeleteConfirm(null)}
					/>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-project-title"
						className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<h3
							id="delete-project-title"
							className="text-lg font-bold text-slate-900 dark:text-white"
						>
							Remover projeto?
						</h3>
						<p className="text-slate-600 dark:text-gray-400 mt-2 text-sm">
							&quot;{deleteConfirm.title}&quot; será removido permanentemente.
						</p>
						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={() => setDeleteConfirm(null)}
								className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] font-medium"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => handleDelete(deleteConfirm)}
								disabled={deleteMutation.isPending}
								className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
							>
								{deleteMutation.isPending && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								Remover
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
