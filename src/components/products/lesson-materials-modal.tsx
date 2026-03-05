'use client';

import {
	FileImage,
	FileText,
	Loader2,
	Trash2,
	UploadCloud,
	X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useDeleteMaterial,
	useMaterials,
	useUploadMaterial,
} from '@/hooks/use-materials';
import type { Material, MaterialType } from '@/types/materials';

const TYPE_ICONS: Record<MaterialType, React.ReactNode> = {
	pdf: <FileText className="w-5 h-5 text-red-400" />,
	word: <FileText className="w-5 h-5 text-blue-400" />,
	image: <FileImage className="w-5 h-5 text-emerald-400" />,
};

const TYPE_LABELS: Record<MaterialType, string> = {
	pdf: 'PDF',
	word: 'Word',
	image: 'Imagem',
};

interface LessonMaterialsModalProps {
	lessonId: string;
	lessonTitle: string;
	onClose: () => void;
}

export function LessonMaterialsModal({
	lessonId,
	lessonTitle,
	onClose,
}: LessonMaterialsModalProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);

	const { data: materials = [], isLoading } = useMaterials(lessonId);
	const upload = useUploadMaterial(lessonId);
	const deleteMaterial = useDeleteMaterial(lessonId);

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return;
		const file = files[0];
		try {
			await upload.mutateAsync({ file });
			toast.success('Material enviado!');
		} catch {
			toast.error('Erro ao enviar material');
		}
	}

	async function handleDelete(mat: Material) {
		try {
			await deleteMaterial.mutateAsync(mat.id);
			toast.success('Material removido');
		} catch {
			toast.error('Erro ao remover material');
		}
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setDragging(false);
		handleFiles(e.dataTransfer.files);
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700 shrink-0">
					<div>
						<h3 className="text-lg font-bold text-slate-900 dark:text-white">
							Material de apoio
						</h3>
						<p className="text-xs text-slate-600 dark:text-gray-500 mt-0.5 truncate max-w-xs">
							{lessonTitle}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>

				{/* Upload area */}
				<div className="p-5 shrink-0">
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
						className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-3 transition-colors ${
							dragging
								? 'border-violet-500 bg-violet-500/10'
								: 'border-slate-300 dark:border-gray-700 hover:border-violet-500/50 hover:bg-violet-500/5'
						} disabled:opacity-50`}
					>
						{upload.isPending ? (
							<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
						) : (
							<UploadCloud className="w-8 h-8 text-slate-500 dark:text-gray-500" />
						)}
						<div className="text-center">
							<p className="text-sm text-slate-700 dark:text-gray-300 font-medium">
								{upload.isPending
									? 'Enviando...'
									: 'Clique ou arraste o arquivo'}
							</p>
							<p className="text-xs text-slate-600 dark:text-gray-600 mt-1">
								PDF, Word ou Imagem — até 500 MB
							</p>
						</div>
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,.doc,.docx,image/*"
						className="hidden"
						onChange={(e) => handleFiles(e.target.files)}
					/>
				</div>

				{/* Materials list */}
				<div className="flex-1 overflow-y-auto px-5 pb-5">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
						</div>
					) : materials.length === 0 ? (
						<p className="text-center text-sm text-slate-600 dark:text-gray-600 py-6">
							Nenhum material adicionado
						</p>
					) : (
						<ul className="space-y-2">
							{materials.map((mat) => (
								<li
									key={mat.id}
									className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-800 rounded-xl group"
								>
									{TYPE_ICONS[mat.type]}
									<div className="flex-1 min-w-0">
										<a
											href={mat.url}
											target="_blank"
											rel="noreferrer"
											className="text-sm font-medium text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-300 transition-colors truncate block"
										>
											{mat.name}
										</a>
										<span className="text-xs text-slate-600 dark:text-gray-500">
											{TYPE_LABELS[mat.type]}
										</span>
									</div>
									<button
										type="button"
										onClick={() => handleDelete(mat)}
										disabled={deleteMaterial.isPending}
										className="p-1.5 text-slate-500 dark:text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
