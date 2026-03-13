'use client';

import {
	ChevronDown,
	ChevronRight,
	ClipboardList,
	Edit,
	FileText,
	Link2,
	Loader2,
	MoveDown,
	MoveUp,
	Paperclip,
	Plus,
	Trash2,
	UploadCloud,
	X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useCourseContent,
	useCreateLesson,
	useCreateModule,
	useDeleteLesson,
	useDeleteModule,
	useReorderLessons,
	useReorderModules,
	useUpdateLesson,
	useUpdateModule,
} from '@/hooks/use-course-content';
import { uploadLessonMaterial } from '@/services/materials';
import type {
	CreateLessonPayload,
	CreateModulePayload,
	Lesson,
	Module,
} from '@/services/modules';
import { uploadLessonVideo } from '@/services/modules';
import type { CourseContentSectionProps } from '@/types/components/course-content-section';
import { LessonMaterialsModal } from './lesson-materials-modal';
import { LessonQuizModal } from './lesson-quiz-modal';

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
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar módulo' : 'Novo módulo'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>

				<div className="p-5 space-y-4">
					<div>
						<label
							htmlFor="module-title"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Título
						</label>
						<input
							id="module-title"
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Ex: Introdução ao curso"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="module-description"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
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
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none resize-none"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
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

	const [videoMode, setVideoMode] = useState<'url' | 'file'>(
		editing?.videoUrl ? 'url' : 'file',
	);
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [materialFiles, setMaterialFiles] = useState<File[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const videoInputRef = useRef<HTMLInputElement>(null);
	const materialInputRef = useRef<HTMLInputElement>(null);

	const isPending = onCreate.isPending || onUpdate.isPending || uploading;

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
						videoUrl:
							videoMode === 'url' && form.videoUrl.trim()
								? form.videoUrl
								: null,
						duration: form.duration,
						order: form.order,
						isFree: form.isFree,
					},
				});
				if (videoMode === 'file' && videoFile) {
					setUploading(true);
					setUploadProgress(0);
					const uploaded = await uploadLessonVideo(
						editing.id,
						videoFile,
						setUploadProgress,
					);
					setUploading(false);
					setUploadProgress(0);
					// atualiza a aula com o videoUrl retornado pelo upload
					await onUpdate.mutateAsync({
						id: editing.id,
						payload: {
							title: form.title,
							description: form.description,
							videoUrl: uploaded.videoUrl ?? null,
							duration: form.duration,
							order: form.order,
							isFree: form.isFree,
						},
					});
				}
				if (materialFiles.length > 0) {
					setUploading(true);
					await Promise.all(
						materialFiles.map((f) => uploadLessonMaterial(editing.id, f)),
					);
					setUploading(false);
				}
				toast.success('Aula atualizada!');
			} else {
				const payload: CreateLessonPayload = {
					moduleId,
					productId,
					title: form.title,
					description: form.description,
					videoUrl:
						videoMode === 'url' && form.videoUrl.trim() ? form.videoUrl : null,
					duration: form.duration,
					order: form.order,
					isFree: form.isFree,
				};
				const created = await onCreate.mutateAsync(payload);
				if (videoMode === 'file' && videoFile) {
					setUploading(true);
					setUploadProgress(0);
					const uploaded = await uploadLessonVideo(
						created.id,
						videoFile,
						setUploadProgress,
					);
					setUploading(false);
					setUploadProgress(0);
					// atualiza a aula com o videoUrl retornado pelo upload
					await onUpdate.mutateAsync({
						id: created.id,
						payload: {
							title: form.title,
							description: form.description,
							videoUrl: uploaded.videoUrl ?? null,
							duration: form.duration,
							order: form.order,
							isFree: form.isFree,
						},
					});
				}
				if (materialFiles.length > 0) {
					setUploading(true);
					await Promise.all(
						materialFiles.map((f) => uploadLessonMaterial(created.id, f)),
					);
					setUploading(false);
				}
				toast.success('Aula criada!');
			}
			onClose();
		} catch (err) {
			setUploading(false);
			setUploadProgress(0);
			console.error('[handleSave] Erro ao salvar aula:', err);
			toast.error('Erro ao salvar aula');
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700 shrink-0">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar aula' : 'Nova aula'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>

				<div className="p-5 space-y-4 overflow-y-auto flex-1">
					<div>
						<label
							htmlFor="lesson-title"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Título
						</label>
						<input
							id="lesson-title"
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Ex: Introdução ao módulo"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="lesson-description"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
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
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none resize-none"
						/>
					</div>

					{/* Vídeo — toggle URL / Arquivo */}
					<div>
						<p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
							Vídeo (opcional)
						</p>
						<div className="flex gap-2 mb-3">
							<button
								type="button"
								onClick={() => setVideoMode('file')}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
									videoMode === 'file'
										? 'bg-violet-600 text-white'
										: 'bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'
								}`}
							>
								<UploadCloud className="w-3.5 h-3.5" />
								Arquivo MP4
							</button>
							<button
								type="button"
								onClick={() => setVideoMode('url')}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
									videoMode === 'url'
										? 'bg-violet-600 text-white'
										: 'bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'
								}`}
							>
								<Link2 className="w-3.5 h-3.5" />
								Link
							</button>
						</div>

						{videoMode === 'url' ? (
							<input
								type="text"
								value={form.videoUrl}
								onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
								placeholder="https://..."
								className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
							/>
						) : (
							<div>
								<button
									type="button"
									onClick={() => videoInputRef.current?.click()}
									className="w-full border-2 border-dashed border-slate-300 dark:border-gray-700 hover:border-violet-500/50 rounded-xl py-5 flex flex-col items-center gap-2 text-slate-600 dark:text-gray-500 hover:text-violet-400 transition-colors"
								>
									<UploadCloud className="w-6 h-6" />
									<span className="text-sm">
										{videoFile
											? videoFile.name
											: 'Clique para selecionar o vídeo'}
									</span>
									{videoFile && (
										<span className="text-xs text-slate-600 dark:text-gray-600">
											{(videoFile.size / 1024 / 1024).toFixed(1)} MB
										</span>
									)}
								</button>
								<input
									ref={videoInputRef}
									type="file"
									accept="video/mp4,video/*"
									className="hidden"
									onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
								/>
							</div>
						)}
					</div>

					{/* Material de apoio */}
					<div>
						<p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
							Material de apoio (opcional)
						</p>
						<button
							type="button"
							onClick={() => materialInputRef.current?.click()}
							className="w-full border-2 border-dashed border-slate-300 dark:border-gray-700 hover:border-amber-500/50 rounded-xl py-4 flex flex-col items-center gap-2 text-slate-600 dark:text-gray-500 hover:text-amber-400 transition-colors"
						>
							<Paperclip className="w-5 h-5" />
							<span className="text-sm">Adicionar PDF ou Word</span>
						</button>
						<input
							ref={materialInputRef}
							type="file"
							accept=".pdf,.doc,.docx"
							multiple
							className="hidden"
							onChange={(e) => {
								const files = Array.from(e.target.files ?? []);
								setMaterialFiles((prev) => [...prev, ...files]);
								e.target.value = '';
							}}
						/>
						{materialFiles.length > 0 && (
							<ul className="mt-2 space-y-1">
								{materialFiles.map((f, i) => (
									<li
										key={`${f.name}-${i}`}
										className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-800 rounded-lg"
									>
										<FileText className="w-4 h-4 text-amber-400 shrink-0" />
										<span className="flex-1 text-xs text-slate-700 dark:text-gray-300 truncate">
											{f.name}
										</span>
										<button
											type="button"
											onClick={() =>
												setMaterialFiles((prev) =>
													prev.filter((_, idx) => idx !== i),
												)
											}
											className="text-slate-500 dark:text-gray-600 hover:text-red-400 transition-colors"
										>
											<X className="w-3.5 h-3.5" />
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<div>
						<label
							htmlFor="lesson-duration"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
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
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
						/>
					</div>
				</div>

				{uploading && videoMode === 'file' && (
					<div className="px-5 pb-3">
						<div className="flex justify-between text-xs text-slate-600 dark:text-gray-400 mb-1">
							<span>Enviando vídeo...</span>
							<span>{uploadProgress}%</span>
						</div>
						<div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-1.5">
							<div
								className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
								style={{ width: `${uploadProgress}%` }}
							/>
						</div>
					</div>
				)}
				<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700 shrink-0">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
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
						{uploading && videoMode === 'file'
							? `Enviando... ${uploadProgress}%`
							: uploading
								? 'Salvando...'
								: editing
									? 'Salvar'
									: 'Criar aula'}
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
	const reorderModules = useReorderModules(product.id);
	const reorderLessons = useReorderLessons(product.id);

	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set(),
	);

	const [moduleModal, setModuleModal] = useState<{
		open: boolean;
		editing: Module | null;
	}>({ open: false, editing: null });

	const [lessonModal, setLessonModal] = useState<{
		open: boolean;
		moduleId: string;
		editing: Lesson | null;
	}>({ open: false, moduleId: '', editing: null });

	const [materialsPanel, setMaterialsPanel] = useState<{
		lessonId: string;
		lessonTitle: string;
	} | null>(null);

	const [quizPanel, setQuizPanel] = useState<{
		lessonId: string;
		lessonTitle: string;
	} | null>(null);

	const toggleModule = (id: string) => {
		setExpandedModules((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// ─── Reorder helpers ───────────────────────────────────────────────────────

	async function moveModule(idx: number, dir: -1 | 1) {
		const sorted = [...modules].sort((a, b) => a.order - b.order);
		const newIdx = idx + dir;
		if (newIdx < 0 || newIdx >= sorted.length) return;
		[sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]];
		try {
			await reorderModules.mutateAsync(sorted.map((m) => m.id));
		} catch {
			toast.error('Erro ao reordenar módulos');
		}
	}

	async function moveLesson(
		moduleId: string,
		lessons: Lesson[],
		idx: number,
		dir: -1 | 1,
	) {
		const sorted = [...lessons].sort((a, b) => a.order - b.order);
		const newIdx = idx + dir;
		if (newIdx < 0 || newIdx >= sorted.length) return;
		[sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]];
		try {
			await reorderLessons.mutateAsync({
				moduleId,
				lessonIds: sorted.map((l) => l.id),
			});
		} catch {
			toast.error('Erro ao reordenar aulas');
		}
	}

	// ─── Delete helpers ────────────────────────────────────────────────────────

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
	const sortedModules = [...modules].sort((a, b) => a.order - b.order);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Conteúdo do curso
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
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
			) : sortedModules.length === 0 ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhum módulo cadastrado
					</p>
					<button
						type="button"
						onClick={() => setModuleModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium"
					>
						Criar primeiro módulo
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{sortedModules.map((mod, modIdx) => {
						const isExpanded = expandedModules.has(mod.id);
						const lessons = [...(mod.lessons ?? [])].sort(
							(a, b) => a.order - b.order,
						);

						return (
							<div
								key={mod.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
							>
								{/* Module Header */}
								<div className="flex items-center gap-2 px-3 py-3">
									{/* Reorder arrows */}
									<div className="flex flex-col gap-0.5 shrink-0">
										<button
											type="button"
											onClick={() => moveModule(modIdx, -1)}
											disabled={modIdx === 0 || reorderModules.isPending}
											className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
										>
											<MoveUp className="w-3 h-3 text-slate-500 dark:text-gray-400" />
										</button>
										<button
											type="button"
											onClick={() => moveModule(modIdx, 1)}
											disabled={
												modIdx === sortedModules.length - 1 ||
												reorderModules.isPending
											}
											className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
										>
											<MoveDown className="w-3 h-3 text-slate-500 dark:text-gray-400" />
										</button>
									</div>

									<button
										type="button"
										onClick={() => toggleModule(mod.id)}
										className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
									>
										{isExpanded ? (
											<ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										)}
									</button>

									<button
										type="button"
										onClick={() => toggleModule(mod.id)}
										className="flex-1 text-left"
									>
										<span className="font-semibold text-slate-900 dark:text-white">
											{mod.title}
										</span>
										<span className="ml-3 text-xs text-slate-600 dark:text-gray-500">
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
											className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
										>
											<Edit className="w-4 h-4 text-slate-500 dark:text-gray-400" />
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
									<div className="border-t border-slate-200 dark:border-gray-800">
										{lessons.length === 0 ? (
											<div className="px-4 py-6 text-center">
												<p className="text-sm text-slate-600 dark:text-gray-500 mb-2">
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
													className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300"
												>
													Adicionar aula
												</button>
											</div>
										) : (
											<ul>
												{lessons.map((lesson, lessonIdx) => (
													<li
														key={lesson.id}
														className={`flex items-center gap-2 px-3 py-2.5 ${
															lessonIdx < lessons.length - 1
																? 'border-b border-slate-200 dark:border-gray-800/60'
																: ''
														} hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors group`}
													>
														{/* Reorder arrows */}
														<div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
															<button
																type="button"
																onClick={() =>
																	moveLesson(mod.id, lessons, lessonIdx, -1)
																}
																disabled={
																	lessonIdx === 0 || reorderLessons.isPending
																}
																className="p-0.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
															>
																<MoveUp className="w-3 h-3 text-slate-500 dark:text-gray-400" />
															</button>
															<button
																type="button"
																onClick={() =>
																	moveLesson(mod.id, lessons, lessonIdx, 1)
																}
																disabled={
																	lessonIdx === lessons.length - 1 ||
																	reorderLessons.isPending
																}
																className="p-0.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
															>
																<MoveDown className="w-3 h-3 text-slate-500 dark:text-gray-400" />
															</button>
														</div>

														<span className="w-6 h-6 flex items-center justify-center text-xs text-slate-600 dark:text-gray-500 font-mono shrink-0">
															{lessonIdx + 1}
														</span>

														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
																{lesson.title}
															</p>
															{lesson.duration > 0 && (
																<p className="text-xs text-slate-600 dark:text-gray-500">
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
															{/* Material */}
															<button
																type="button"
																onClick={() =>
																	setMaterialsPanel({
																		lessonId: lesson.id,
																		lessonTitle: lesson.title,
																	})
																}
																title="Material de apoio"
																className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
															>
																<Paperclip className="w-3.5 h-3.5" />
																<span className="hidden sm:inline">
																	Material
																</span>
															</button>

															{/* Quiz */}
															<button
																type="button"
																onClick={() =>
																	setQuizPanel({
																		lessonId: lesson.id,
																		lessonTitle: lesson.title,
																	})
																}
																title="Quiz"
																className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors"
															>
																<ClipboardList className="w-3.5 h-3.5" />
																<span className="hidden sm:inline">Quiz</span>
															</button>

															<button
																type="button"
																onClick={() =>
																	setLessonModal({
																		open: true,
																		moduleId: mod.id,
																		editing: lesson,
																	})
																}
																className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
															>
																<Edit className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400" />
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

			{/* Materials Modal */}
			{materialsPanel && (
				<LessonMaterialsModal
					lessonId={materialsPanel.lessonId}
					lessonTitle={materialsPanel.lessonTitle}
					onClose={() => setMaterialsPanel(null)}
				/>
			)}

			{/* Quiz Modal */}
			{quizPanel && (
				<LessonQuizModal
					lessonId={quizPanel.lessonId}
					lessonTitle={quizPanel.lessonTitle}
					onClose={() => setQuizPanel(null)}
				/>
			)}
		</div>
	);
}
