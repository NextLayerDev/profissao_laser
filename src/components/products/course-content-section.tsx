'use client';

import {
	ChevronDown,
	ChevronRight,
	Edit,
	Loader2,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCourseContent,
	useCreateLesson,
	useCreateModule,
	useDeleteLesson,
	useDeleteModule,
	useUpdateLesson,
	useUpdateModule,
} from '@/hooks/use-course-content';
import type {
	CreateLessonPayload,
	CreateModulePayload,
	Lesson,
	Module,
} from '@/services/modules';
import type { CourseContentSectionProps } from '@/types/components/course-content-section';

// ─── Module Modal ────────────────────────────────────────────────────────────

interface ModuleModalProps {
	productId: string;
	editing: Module | null;
	nextOrder: number;
	onClose: () => void;
	onCreate: ReturnType<typeof useCreateModule>;
	onUpdate: ReturnType<typeof useUpdateModule>;
}

function ModuleModal({
	productId,
	editing,
	nextOrder,
	onClose,
	onCreate,
	onUpdate,
}: ModuleModalProps) {
	const [form, setForm] = useState({
		title: editing?.title ?? '',
		description: editing?.description ?? '',
		order: editing?.order ?? nextOrder,
	});

	const isPending = onCreate.isPending || onUpdate.isPending;

	const handleSave = async () => {
		if (!form.title.trim()) {
			toast.error('Título é obrigatório');
			return;
		}
		try {
			if (editing) {
				await onUpdate.mutateAsync({
					id: editing.id,
					payload: {
						title: form.title,
						description: form.description,
						order: form.order,
					},
				});
				toast.success('Módulo atualizado!');
			} else {
				const payload: CreateModulePayload = {
					productId,
					title: form.title,
					description: form.description,
					order: form.order,
				};
				await onCreate.mutateAsync(payload);
				toast.success('Módulo criado!');
			}
			onClose();
		} catch {
			toast.error('Erro ao salvar módulo');
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
				<div className="flex items-center justify-between p-5 border-b border-gray-700">
					<h3 className="text-lg font-bold text-white">
						{editing ? 'Editar módulo' : 'Novo módulo'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-gray-400" />
					</button>
				</div>

				<div className="p-5 space-y-4">
					<div>
						<label
							htmlFor="module-title"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							Título
						</label>
						<input
							id="module-title"
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Ex: Introdução ao curso"
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="module-description"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							Descrição (opcional)
						</label>
						<textarea
							id="module-description"
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={3}
							placeholder="Descrição do módulo..."
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none resize-none"
						/>
					</div>

					<div>
						<label
							htmlFor="module-order"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							Ordem
						</label>
						<input
							id="module-order"
							type="number"
							min={0}
							value={form.order}
							onChange={(e) =>
								setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })
							}
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3 p-5 border-t border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						{editing ? 'Salvar' : 'Criar módulo'}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Lesson Modal ─────────────────────────────────────────────────────────────

interface LessonModalProps {
	productId: string;
	moduleId: string;
	editing: Lesson | null;
	nextOrder: number;
	onClose: () => void;
	onCreate: ReturnType<typeof useCreateLesson>;
	onUpdate: ReturnType<typeof useUpdateLesson>;
}

function LessonModal({
	productId,
	moduleId,
	editing,
	nextOrder,
	onClose,
	onCreate,
	onUpdate,
}: LessonModalProps) {
	const [form, setForm] = useState({
		title: editing?.title ?? '',
		description: editing?.description ?? '',
		videoUrl: editing?.videoUrl ?? '',
		duration: editing?.duration ?? 1,
		order: editing?.order ?? nextOrder,
		isFree: editing?.isFree ?? false,
	});

	const isPending = onCreate.isPending || onUpdate.isPending;

	const handleSave = async () => {
		if (!form.title.trim()) {
			toast.error('Título é obrigatório');
			return;
		}
		try {
			if (editing) {
				await onUpdate.mutateAsync({
					id: editing.id,
					payload: {
						title: form.title,
						description: form.description,
						videoUrl: form.videoUrl,
						duration: form.duration,
						order: form.order,
						isFree: form.isFree,
					},
				});
				toast.success('Aula atualizada!');
			} else {
				const payload: CreateLessonPayload = {
					moduleId,
					productId,
					title: form.title,
					description: form.description,
					videoUrl: form.videoUrl,
					duration: form.duration,
					order: form.order,
					isFree: form.isFree,
				};
				await onCreate.mutateAsync(payload);
				toast.success('Aula criada!');
			}
			onClose();
		} catch {
			toast.error('Erro ao salvar aula');
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
				<div className="flex items-center justify-between p-5 border-b border-gray-700">
					<h3 className="text-lg font-bold text-white">
						{editing ? 'Editar aula' : 'Nova aula'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-gray-400" />
					</button>
				</div>

				<div className="p-5 space-y-4">
					<div>
						<label
							htmlFor="lesson-title"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							Título
						</label>
						<input
							id="lesson-title"
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Ex: Introdução ao módulo"
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="lesson-description"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							Descrição (opcional)
						</label>
						<textarea
							id="lesson-description"
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={2}
							placeholder="Descrição da aula..."
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none resize-none"
						/>
					</div>

					<div>
						<label
							htmlFor="lesson-video-url"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							URL do vídeo (opcional)
						</label>
						<input
							id="lesson-video-url"
							type="text"
							value={form.videoUrl}
							onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
							placeholder="https://..."
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="lesson-duration"
								className="text-sm font-medium text-gray-300 mb-1.5 block"
							>
								Duração (segundos)
							</label>
							<input
								id="lesson-duration"
								type="number"
								min={1}
								value={form.duration}
								onChange={(e) =>
									setForm({
										...form,
										duration: parseInt(e.target.value, 10) || 1,
									})
								}
								className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
							/>
						</div>
						<div>
							<label
								htmlFor="lesson-order"
								className="text-sm font-medium text-gray-300 mb-1.5 block"
							>
								Ordem
							</label>
							<input
								id="lesson-order"
								type="number"
								min={0}
								value={form.order}
								onChange={(e) =>
									setForm({
										...form,
										order: parseInt(e.target.value, 10) || 0,
									})
								}
								className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
							/>
						</div>
					</div>

					<label className="flex items-center gap-3 cursor-pointer">
						<div className="relative">
							<input
								type="checkbox"
								checked={form.isFree}
								onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
								className="sr-only"
							/>
							<div
								className={`w-10 h-5 rounded-full transition-colors ${
									form.isFree ? 'bg-violet-600' : 'bg-gray-600'
								}`}
							/>
							<div
								className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
									form.isFree ? 'left-5.5 translate-x-0.5' : 'left-0.5'
								}`}
							/>
						</div>
						<span className="text-sm text-gray-300">
							Aula gratuita (preview)
						</span>
					</label>
				</div>

				<div className="flex justify-end gap-3 p-5 border-t border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						{editing ? 'Salvar' : 'Criar aula'}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function CourseContentSection({ product }: CourseContentSectionProps) {
	const { data: modules = [], isLoading } = useCourseContent(product.id);
	const createModule = useCreateModule(product.id);
	const updateModule = useUpdateModule(product.id);
	const deleteModuleMutation = useDeleteModule(product.id);
	const createLesson = useCreateLesson(product.id);
	const updateLesson = useUpdateLesson(product.id);
	const deleteLesson = useDeleteLesson(product.id);

	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set(),
	);

	// Module modal state
	const [moduleModal, setModuleModal] = useState<{
		open: boolean;
		editing: Module | null;
	}>({ open: false, editing: null });

	// Lesson modal state
	const [lessonModal, setLessonModal] = useState<{
		open: boolean;
		moduleId: string;
		editing: Lesson | null;
	}>({ open: false, moduleId: '', editing: null });

	const toggleModule = (id: string) => {
		setExpandedModules((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleDeleteModule = async (mod: Module) => {
		if (
			!confirm(
				`Excluir o módulo "${mod.title}"? Todas as aulas serão removidas.`,
			)
		)
			return;
		try {
			await deleteModuleMutation.mutateAsync(mod.id);
			toast.success('Módulo excluído!');
		} catch {
			toast.error('Erro ao excluir módulo');
		}
	};

	const handleDeleteLesson = async (lesson: Lesson) => {
		if (!confirm(`Excluir a aula "${lesson.title}"?`)) return;
		try {
			await deleteLesson.mutateAsync(lesson.id);
			toast.success('Aula excluída!');
		} catch {
			toast.error('Erro ao excluir aula');
		}
	};

	const totalLessons = modules.reduce(
		(acc, m) => acc + (m.lessons?.length ?? 0),
		0,
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-white">Conteúdo do curso</h2>
					<p className="text-sm text-gray-400 mt-1">
						{modules.length} módulo{modules.length !== 1 ? 's' : ''} ·{' '}
						{totalLessons} aula{totalLessons !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setModuleModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo módulo
				</button>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="w-8 h-8 animate-spin text-violet-500" />
				</div>
			) : modules.length === 0 ? (
				<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-12 text-center">
					<p className="text-gray-400 mb-4">Nenhum módulo cadastrado</p>
					<button
						type="button"
						onClick={() => setModuleModal({ open: true, editing: null })}
						className="text-violet-400 hover:text-violet-300 font-medium"
					>
						Criar primeiro módulo
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{modules.map((mod) => {
						const isExpanded = expandedModules.has(mod.id);
						const lessons = mod.lessons ?? [];

						return (
							<div
								key={mod.id}
								className="bg-[#1a1a1d] border border-gray-800 rounded-xl overflow-hidden"
							>
								{/* Module Header */}
								<div className="flex items-center gap-3 px-4 py-4">
									<button
										type="button"
										onClick={() => toggleModule(mod.id)}
										className="p-1 hover:bg-gray-700 rounded transition-colors"
									>
										{isExpanded ? (
											<ChevronDown className="w-4 h-4 text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-gray-400" />
										)}
									</button>

									<button
										type="button"
										onClick={() => toggleModule(mod.id)}
										className="flex-1 text-left"
									>
										<span className="font-semibold text-white">
											{mod.title}
										</span>
										<span className="ml-3 text-xs text-gray-500">
											{lessons.length} aula{lessons.length !== 1 ? 's' : ''}
										</span>
									</button>

									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() =>
												setLessonModal({
													open: true,
													moduleId: mod.id,
													editing: null,
												})
											}
											className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
										>
											<Plus className="w-3.5 h-3.5" />
											Aula
										</button>
										<button
											type="button"
											onClick={() =>
												setModuleModal({ open: true, editing: mod })
											}
											className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
										>
											<Edit className="w-4 h-4 text-gray-400" />
										</button>
										<button
											type="button"
											onClick={() => handleDeleteModule(mod)}
											className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
										>
											<Trash2 className="w-4 h-4 text-red-500" />
										</button>
									</div>
								</div>

								{/* Lessons */}
								{isExpanded && (
									<div className="border-t border-gray-800">
										{lessons.length === 0 ? (
											<div className="px-4 py-6 text-center">
												<p className="text-sm text-gray-500 mb-2">
													Nenhuma aula neste módulo
												</p>
												<button
													type="button"
													onClick={() =>
														setLessonModal({
															open: true,
															moduleId: mod.id,
															editing: null,
														})
													}
													className="text-sm text-violet-400 hover:text-violet-300"
												>
													Adicionar aula
												</button>
											</div>
										) : (
											<ul>
												{lessons.map((lesson, idx) => (
													<li
														key={lesson.id}
														className={`flex items-center gap-3 px-4 py-3 ${
															idx < lessons.length - 1
																? 'border-b border-gray-800/60'
																: ''
														} hover:bg-gray-800/30 transition-colors`}
													>
														<span className="w-6 h-6 flex items-center justify-center text-xs text-gray-500 font-mono shrink-0">
															{idx + 1}
														</span>

														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-white truncate">
																{lesson.title}
															</p>
															{lesson.duration > 0 && (
																<p className="text-xs text-gray-500">
																	{Math.floor(lesson.duration / 60)}m{' '}
																	{lesson.duration % 60}s
																</p>
															)}
														</div>

														{lesson.isFree && (
															<span className="shrink-0 text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
																Grátis
															</span>
														)}

														<div className="flex items-center gap-1 shrink-0">
															<button
																type="button"
																onClick={() =>
																	setLessonModal({
																		open: true,
																		moduleId: mod.id,
																		editing: lesson,
																	})
																}
																className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
															>
																<Edit className="w-3.5 h-3.5 text-gray-400" />
															</button>
															<button
																type="button"
																onClick={() => handleDeleteLesson(lesson)}
																className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
															>
																<Trash2 className="w-3.5 h-3.5 text-red-500" />
															</button>
														</div>
													</li>
												))}
											</ul>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Module Modal */}
			{moduleModal.open && (
				<ModuleModal
					productId={product.id}
					editing={moduleModal.editing}
					nextOrder={modules.length}
					onClose={() => setModuleModal({ open: false, editing: null })}
					onCreate={createModule}
					onUpdate={updateModule}
				/>
			)}

			{/* Lesson Modal */}
			{lessonModal.open && (
				<LessonModal
					productId={product.id}
					moduleId={lessonModal.moduleId}
					editing={lessonModal.editing}
					nextOrder={
						modules.find((m) => m.id === lessonModal.moduleId)?.lessons
							?.length ?? 0
					}
					onClose={() =>
						setLessonModal({ open: false, moduleId: '', editing: null })
					}
					onCreate={createLesson}
					onUpdate={updateLesson}
				/>
			)}
		</div>
	);
}
