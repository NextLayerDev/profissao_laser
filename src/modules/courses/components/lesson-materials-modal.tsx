'use client';

import { FileText, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	useDeleteMaterial,
	useLessonMaterials,
	useUploadLessonMaterial,
} from '../hooks/use-lesson-materials';
import type { Material } from '../types/materials';

function formatBytes(bytes: number | null | undefined): string {
	if (bytes == null) return '';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeLabel(mime: string | null | undefined): string {
	if (!mime) return '';
	if (mime.startsWith('image/')) return 'Imagem';
	if (mime === 'application/pdf') return 'PDF';
	if (
		mime === 'application/msword' ||
		mime ===
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	)
		return 'Word';
	return mime.split('/')[1]?.toUpperCase() ?? mime;
}

interface Props {
	lessonId: string;
	lessonTitle: string;
	onClose: () => void;
}

export function LessonMaterialsModal({
	lessonId,
	lessonTitle,
	onClose,
}: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);

	const { data: materials = [], isLoading } = useLessonMaterials(lessonId);
	const upload = useUploadLessonMaterial(lessonId);
	const remove = useDeleteMaterial(lessonId);

	function handleFiles(files: FileList | null) {
		const file = files?.[0];
		if (!file) return;
		upload.mutate(file);
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setDragging(false);
		handleFiles(e.dataTransfer.files);
	}

	function handleDelete(mat: Material) {
		if (!confirm(`Remover "${mat.filename}"?`)) return;
		remove.mutate(mat.id);
	}

	return (
		<ModalOverlay onClose={onClose} tone="courses">
			<div className="p-6 space-y-4">
				{/* Header */}
				<div className="flex items-start justify-between gap-3">
					<div>
						<h3 className="text-lg font-bold text-slate-900 dark:text-white">
							Material de apoio
						</h3>
						<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">
							{lessonTitle}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Upload area */}
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={handleDrop}
					disabled={upload.isPending}
					className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-3 transition-colors disabled:opacity-50 ${
						dragging
							? 'border-sky-500 bg-sky-500/10'
							: 'border-slate-300 dark:border-white/15 hover:border-sky-500/50 hover:bg-sky-500/5'
					}`}
				>
					{upload.isPending ? (
						<Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
					) : (
						<UploadCloud className="w-8 h-8 text-slate-400" />
					)}
					<p className="text-sm text-slate-600 dark:text-gray-300 font-medium">
						{upload.isPending ? 'Enviando...' : 'Clique ou arraste o arquivo'}
					</p>
				</button>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					onChange={(e) => handleFiles(e.target.files)}
				/>

				{/* Materials list */}
				<div className="space-y-2 max-h-64 overflow-y-auto">
					{isLoading ? (
						<div className="flex items-center justify-center py-6">
							<Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
						</div>
					) : materials.length === 0 ? (
						<p className="text-center text-sm text-slate-500 dark:text-gray-500 py-4">
							Nenhum material adicionado
						</p>
					) : (
						<ul className="space-y-2">
							{materials.map((mat) => (
								<li
									key={mat.id}
									className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] group"
								>
									<FileText className="w-4 h-4 text-sky-400 shrink-0" />
									<div className="flex-1 min-w-0">
										<a
											href={mat.file_url}
											target="_blank"
											rel="noreferrer"
											className="text-sm font-medium text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 truncate block transition-colors"
										>
											{mat.filename}
										</a>
										<span className="text-xs text-slate-500 dark:text-gray-500">
											{[mimeLabel(mat.mime), formatBytes(mat.size_bytes)]
												.filter(Boolean)
												.join(' · ')}
										</span>
									</div>
									<button
										type="button"
										onClick={() => handleDelete(mat)}
										disabled={remove.isPending}
										className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</ModalOverlay>
	);
}
