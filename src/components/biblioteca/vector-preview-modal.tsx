'use client';

import { Download, Heart, X } from 'lucide-react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type { VectorLibraryFile } from '@/types/vector-library';

interface VectorPreviewModalProps {
	file: VectorLibraryFile;
	badge: string;
	badgeColor: string;
	isImage: boolean;
	isFavoriting: boolean;
	onClose: () => void;
	onDownload: (file: VectorLibraryFile) => void;
	onToggleFavorite: (file: VectorLibraryFile) => void;
}

export function VectorPreviewModal({
	file,
	badge,
	badgeColor,
	isImage,
	isFavoriting,
	onClose,
	onDownload,
	onToggleFavorite,
}: VectorPreviewModalProps) {
	const formats = file.formats?.filter(Boolean) ?? [];

	return (
		<ModalOverlay onClose={onClose} widthClassName="max-w-2xl">
			<div className="relative">
				{/* Close */}
				<button
					type="button"
					onClick={onClose}
					aria-label="Fechar"
					className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-md transition-colors"
				>
					<X className="w-4 h-4" />
				</button>

				{/* Preview image / icon */}
				<div className="flex items-center justify-center bg-slate-50 dark:bg-[#141416] min-h-[280px] max-h-[60vh] overflow-hidden rounded-t-xl">
					{isImage ? (
						<img
							src={file.fileUrl}
							alt={file.name}
							className="max-h-[60vh] w-auto object-contain"
						/>
					) : (
						<div className="flex flex-col items-center gap-3 py-16">
							<div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
								<span className="text-white font-black text-lg">{badge}</span>
							</div>
							<p className="text-sm text-slate-500 dark:text-gray-400">
								Pré-visualização indisponível
							</p>
						</div>
					)}
				</div>

				{/* Info + actions */}
				<div className="p-5">
					<span
						className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase mb-2 ${badgeColor}`}
					>
						{badge}
					</span>
					<h3 className="text-lg font-bold text-slate-900 dark:text-white break-words">
						{file.name}
					</h3>

					<div className="mt-2 space-y-1 text-sm text-slate-500 dark:text-gray-400">
						{file.category && (
							<p>
								Categoria:{' '}
								<span className="text-slate-700 dark:text-slate-300 font-medium">
									{file.category}
								</span>
							</p>
						)}
						{formats.length > 0 && (
							<p>
								Formatos:{' '}
								<span className="text-slate-700 dark:text-slate-300 font-medium">
									{formats.join(', ')}
								</span>
							</p>
						)}
					</div>

					<div className="mt-5 flex flex-col sm:flex-row gap-3">
						<button
							type="button"
							onClick={() => onDownload(file)}
							className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
						>
							<Download className="w-4 h-4" />
							Baixar
						</button>
						<button
							type="button"
							onClick={() => onToggleFavorite(file)}
							disabled={isFavoriting}
							className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-60 ${
								file.isFavorited
									? 'border-red-300 dark:border-red-500/40 text-red-500 bg-red-50 dark:bg-red-500/10'
									: 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-300 hover:text-red-500'
							}`}
						>
							<Heart
								className={`w-4 h-4 ${file.isFavorited ? 'fill-current' : ''}`}
							/>
							{file.isFavorited ? 'Favoritado' : 'Favoritar'}
						</button>
					</div>
				</div>
			</div>
		</ModalOverlay>
	);
}
