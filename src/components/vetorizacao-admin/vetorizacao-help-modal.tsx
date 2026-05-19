'use client';

import type { LucideIcon } from 'lucide-react';
import {
	BookOpen,
	ChevronRight,
	FileText,
	HelpCircle,
	ImageIcon,
	Layers,
	Lightbulb,
	Loader2,
	Play,
	Target,
	Video,
	X,
	Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useCourseContent } from '@/hooks/use-course-content';
import { useProducts } from '@/hooks/use-products';
import type {
	CreateVectorizeHelpPayload,
	VectorizeHelpIcon,
	VectorizeHelpItem,
} from '@/types/vectorize-help';

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

export const HELP_ICON_MAP: Record<VectorizeHelpIcon, LucideIcon> = {
	play: Play,
	zap: Zap,
	image: ImageIcon,
	'help-circle': HelpCircle,
	'book-open': BookOpen,
	lightbulb: Lightbulb,
	video: Video,
	'file-text': FileText,
	layers: Layers,
	target: Target,
};

const ICON_OPTIONS: { value: VectorizeHelpIcon; label: string }[] = [
	{ value: 'play', label: 'Play' },
	{ value: 'zap', label: 'Zap' },
	{ value: 'image', label: 'Imagem' },
	{ value: 'help-circle', label: 'Ajuda' },
	{ value: 'book-open', label: 'Livro' },
	{ value: 'lightbulb', label: 'Lampada' },
	{ value: 'video', label: 'Video' },
	{ value: 'file-text', label: 'Documento' },
	{ value: 'layers', label: 'Camadas' },
	{ value: 'target', label: 'Alvo' },
];

/* ------------------------------------------------------------------ */
/*  Lesson Picker (reused pattern from kb-modal)                       */
/* ------------------------------------------------------------------ */

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
							Nenhuma aula com video neste curso.
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

			{value && (
				<div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
					<Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
					<span className="text-xs text-emerald-700 dark:text-emerald-400 truncate">
						Video selecionado
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

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

interface VetorizacaoHelpModalProps {
	editing: VectorizeHelpItem | null;
	nextOrder: number;
	onClose: () => void;
	onSave: (data: CreateVectorizeHelpPayload) => Promise<void>;
}

export function VetorizacaoHelpModal({
	editing,
	nextOrder,
	onClose,
	onSave,
}: VetorizacaoHelpModalProps) {
	const [title, setTitle] = useState(editing?.title ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [icon, setIcon] = useState<VectorizeHelpIcon>(editing?.icon ?? 'play');
	const [type, setType] = useState<'text' | 'video'>(editing?.type ?? 'text');
	const [content, setContent] = useState(editing?.content ?? '');
	const [videoUrl, setVideoUrl] = useState(editing?.videoUrl ?? '');
	const [order, setOrder] = useState(editing?.order ?? nextOrder);
	const [active, setActive] = useState(editing?.active ?? true);
	const [saving, setSaving] = useState(false);

	const SelectedIcon = HELP_ICON_MAP[icon];
	const canSave =
		title.trim() &&
		description.trim() &&
		(type === 'text' || (type === 'video' && videoUrl.trim()));

	async function handleSave() {
		if (!canSave) return;
		setSaving(true);
		try {
			await onSave({
				title: title.trim(),
				description: description.trim(),
				icon,
				type,
				content: type === 'text' ? content.trim() || undefined : undefined,
				videoUrl: type === 'video' ? videoUrl.trim() : undefined,
				order,
				active,
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
						{editing ? 'Editar item de ajuda' : 'Novo item de ajuda'}
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
							{(['text', 'video'] as const).map((t) => (
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
									{t === 'text' ? 'Texto' : 'Video'}
								</button>
							))}
						</div>
					</div>

					{/* Titulo */}
					<div>
						<label
							htmlFor="vh-title"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Titulo
						</label>
						<input
							id="vh-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ex: Tutorial"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					{/* Descricao */}
					<div>
						<label
							htmlFor="vh-desc"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Descricao
						</label>
						<input
							id="vh-desc"
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Ex: Aprenda a vetorizar passo a passo"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					{/* Icone */}
					<div>
						<label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Icone
						</label>
						<div className="grid grid-cols-5 gap-2">
							{ICON_OPTIONS.map((opt) => {
								const Icon = HELP_ICON_MAP[opt.value];
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => setIcon(opt.value)}
										className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs transition-colors ${
											icon === opt.value
												? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-500/40'
												: 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 border border-transparent hover:bg-slate-100 dark:hover:bg-white/10'
										}`}
									>
										<Icon className="w-5 h-5" />
										<span className="truncate w-full text-center">
											{opt.label}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Conteudo (texto) */}
					{type === 'text' && (
						<div>
							<label
								htmlFor="vh-content"
								className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
							>
								Conteudo
							</label>
							<textarea
								id="vh-content"
								value={content}
								onChange={(e) => setContent(e.target.value)}
								rows={5}
								placeholder="Escreva o conteudo de ajuda..."
								className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none resize-none"
							/>
						</div>
					)}

					{/* Selecionar aula (video) */}
					{type === 'video' && (
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Selecionar aula
							</label>
							<LessonPicker value={videoUrl} onChange={handleLessonSelected} />
						</div>
					)}

					{/* Ordem + Ativo */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="vh-order"
								className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
							>
								Ordem
							</label>
							<input
								id="vh-order"
								type="number"
								value={order}
								onChange={(e) => setOrder(Number(e.target.value))}
								min={0}
								className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
							/>
						</div>
						<div className="flex items-center gap-3 pt-6">
							<label
								htmlFor="vh-active"
								className="text-sm font-medium text-slate-700 dark:text-gray-300"
							>
								Ativo
							</label>
							<button
								id="vh-active"
								type="button"
								onClick={() => setActive(!active)}
								className={`relative w-10 h-6 rounded-full transition-colors ${
									active ? 'bg-violet-600' : 'bg-slate-300 dark:bg-gray-600'
								}`}
							>
								<span
									className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
										active ? 'left-[18px]' : 'left-0.5'
									}`}
								/>
							</button>
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
