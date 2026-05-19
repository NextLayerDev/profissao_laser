'use client';

import { ChevronRight, Loader2, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCourseContent } from '@/hooks/use-course-content';
import { useProducts } from '@/hooks/use-products';
import type { CreateKnowledgeBasePayload } from '@/services/knowledge-base';
import type { KnowledgeBaseArticle } from '@/types/knowledge-base';

interface KBModalProps {
	editing: KnowledgeBaseArticle | null;
	nextOrder: number;
	onClose: () => void;
	onSave: (data: CreateKnowledgeBasePayload) => Promise<void>;
}

function LessonPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (url: string, lessonTitle: string) => void;
}) {
	const { products = [], isLoading: productsLoading } = useProducts();
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);

	const { data: modules = [], isLoading: modulesLoading } = useCourseContent(
		selectedProductId ?? '',
	);

	// Flatten all lessons with video
	const videoLessons = modules.flatMap((mod) =>
		mod.lessons
			.filter((l) => l.videoUrl)
			.map((l) => ({ ...l, moduleName: mod.title })),
	);

	if (productsLoading) {
		return (
			<div className="flex items-center gap-2 py-4 text-slate-500">
				<Loader2 className="w-4 h-4 animate-spin" />
				<span className="text-sm">Carregando cursos...</span>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* Step 1: Select product/course */}
			<div>
				<label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block">
					Curso
				</label>
				<select
					value={selectedProductId ?? ''}
					onChange={(e) => setSelectedProductId(e.target.value || null)}
					className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white text-sm focus:border-violet-500 focus:outline-none"
				>
					<option value="">Selecione um curso</option>
					{products.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
			</div>

			{/* Step 2: Select lesson */}
			{selectedProductId && (
				<div>
					<label className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block">
						Aula
					</label>
					{modulesLoading ? (
						<div className="flex items-center gap-2 py-3 text-slate-500">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span className="text-sm">Carregando aulas...</span>
						</div>
					) : videoLessons.length === 0 ? (
						<p className="text-sm text-slate-500 dark:text-gray-400 py-2">
							Nenhuma aula com vídeo neste curso.
						</p>
					) : (
						<div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-gray-700 rounded-lg divide-y divide-slate-100 dark:divide-gray-700/50">
							{videoLessons.map((lesson) => (
								<button
									key={lesson.id}
									type="button"
									onClick={() => onChange(lesson.videoUrl!, lesson.title)}
									className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${
										value === lesson.videoUrl
											? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'
											: 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-900 dark:text-white'
									}`}
								>
									<Play
										className={`w-3.5 h-3.5 shrink-0 ${
											value === lesson.videoUrl
												? 'text-violet-600 dark:text-violet-400'
												: 'text-slate-400'
										}`}
									/>
									<div className="min-w-0 flex-1">
										<p className="font-medium truncate">{lesson.title}</p>
										<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
											{lesson.moduleName}
										</p>
									</div>
									{value === lesson.videoUrl && (
										<ChevronRight className="w-4 h-4 text-violet-500 shrink-0" />
									)}
								</button>
							))}
						</div>
					)}
				</div>
			)}

			{/* Selected indicator */}
			{value && (
				<div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
					<Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
					<span className="text-xs text-emerald-700 dark:text-emerald-400 truncate">
						Vídeo selecionado
					</span>
					<button
						type="button"
						onClick={() => onChange('', '')}
						className="ml-auto text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 shrink-0"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			)}
		</div>
	);
}

export function KBModal({ editing, nextOrder, onClose, onSave }: KBModalProps) {
	const [title, setTitle] = useState(editing?.title ?? '');
	const [type, setType] = useState<'article' | 'video'>(
		editing?.type ?? 'article',
	);
	const [content, setContent] = useState(editing?.content ?? '');
	const [excerpt, setExcerpt] = useState(editing?.excerpt ?? '');
	const [videoUrl, setVideoUrl] = useState(editing?.videoUrl ?? '');
	const [readTime, setReadTime] = useState(editing?.readTime ?? 5);
	const [category, setCategory] = useState(editing?.category ?? '');
	const [isPublished, setIsPublished] = useState(editing?.isPublished ?? true);
	const [order, setOrder] = useState(editing?.order ?? nextOrder);
	const [saving, setSaving] = useState(false);

	const canSave =
		title.trim() &&
		(type === 'article' || (type === 'video' && videoUrl.trim()));

	async function handleSave() {
		if (!canSave) return;
		setSaving(true);
		try {
			await onSave({
				title: title.trim(),
				type,
				content: content.trim() || undefined,
				excerpt: excerpt.trim() || undefined,
				videoUrl: type === 'video' ? videoUrl.trim() : undefined,
				readTime: readTime || undefined,
				category: category.trim() || undefined,
				isPublished,
				order,
			});
			onClose();
		} catch {
			// erro tratado pelo pai
		} finally {
			setSaving(false);
		}
	}

	function handleLessonSelected(url: string, lessonTitle: string) {
		setVideoUrl(url);
		if (!title.trim() && lessonTitle) {
			setTitle(lessonTitle);
		}
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar artigo' : 'Novo artigo'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>

				{/* Body */}
				<div className="p-5 space-y-4">
					{/* Tipo */}
					<div>
						<label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Tipo
						</label>
						<div className="flex gap-2">
							{(['article', 'video'] as const).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setType(t)}
									className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
										type === t
											? 'bg-violet-600 text-white'
											: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15'
									}`}
								>
									{t === 'article' ? 'Artigo' : 'Vídeo'}
								</button>
							))}
						</div>
					</div>

					{/* Título */}
					<div>
						<label
							htmlFor="kb-title"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Título
						</label>
						<input
							id="kb-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ex: Como trocar a lente"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					{/* Selecionar vídeo do curso (só para vídeo) */}
					{type === 'video' && (
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Selecionar aula
							</label>
							<LessonPicker value={videoUrl} onChange={handleLessonSelected} />
						</div>
					)}

					{/* Resumo */}
					<div>
						<label
							htmlFor="kb-excerpt"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Resumo (opcional)
						</label>
						<input
							id="kb-excerpt"
							type="text"
							value={excerpt}
							onChange={(e) => setExcerpt(e.target.value)}
							placeholder="Breve descrição do artigo"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					{/* Conteúdo */}
					<div>
						<label
							htmlFor="kb-content"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Conteúdo {type === 'video' ? '(opcional)' : ''}
						</label>
						<textarea
							id="kb-content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={5}
							placeholder="Escreva o conteúdo do artigo..."
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none resize-none"
						/>
					</div>

					{/* Categoria + Tempo */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="kb-category"
								className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
							>
								Categoria (opcional)
							</label>
							<input
								id="kb-category"
								type="text"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								placeholder="Ex: Manutenção"
								className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
							/>
						</div>
						<div>
							<label
								htmlFor="kb-readtime"
								className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
							>
								Tempo (min)
							</label>
							<input
								id="kb-readtime"
								type="number"
								value={readTime}
								onChange={(e) => setReadTime(Number(e.target.value))}
								min={0}
								className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
							/>
						</div>
					</div>

					{/* Publicado + Ordem */}
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center gap-3">
							<label
								htmlFor="kb-published"
								className="text-sm font-medium text-slate-700 dark:text-gray-300"
							>
								Publicado
							</label>
							<button
								id="kb-published"
								type="button"
								onClick={() => setIsPublished(!isPublished)}
								className={`relative w-10 h-6 rounded-full transition-colors ${
									isPublished
										? 'bg-violet-600'
										: 'bg-slate-300 dark:bg-gray-600'
								}`}
							>
								<span
									className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
										isPublished ? 'left-[18px]' : 'left-0.5'
									}`}
								/>
							</button>
						</div>
						<div>
							<label
								htmlFor="kb-order"
								className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
							>
								Ordem
							</label>
							<input
								id="kb-order"
								type="number"
								value={order}
								onChange={(e) => setOrder(Number(e.target.value))}
								min={0}
								className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
							/>
						</div>
					</div>
				</div>

				{/* Footer */}
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
						onClick={() => void handleSave()}
						disabled={saving || !canSave}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}
