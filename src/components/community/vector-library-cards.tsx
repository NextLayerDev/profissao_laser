'use client';

import { ChevronRight, Download, FolderOpen } from 'lucide-react';
import type {
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';
import { getFileIcon } from '@/utils/vector-library';

interface VectorLibraryCardsProps {
	folders: VectorLibraryFolder[];
	files: VectorLibraryFile[];
	onFolderClick: (folderId: string) => void;
	onFileDownload: (file: VectorLibraryFile) => void;
}

function isImageMime(mimeType: string): boolean {
	const t = mimeType.toLowerCase();
	return (
		t.includes('image') ||
		t.includes('svg') ||
		t.includes('png') ||
		t.includes('jpg') ||
		t.includes('jpeg') ||
		t.includes('webp') ||
		t.includes('gif')
	);
}

export function VectorLibraryCards({
	folders,
	files,
	onFolderClick,
	onFileDownload,
}: VectorLibraryCardsProps) {
	const sortedFolders = [...folders].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	);
	const sortedFiles = [...files].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	);

	const hasItems = sortedFolders.length > 0 || sortedFiles.length > 0;

	if (!hasItems) {
		return (
			<div className="text-center py-20 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
				<FolderOpen className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6 opacity-60" />
				<p className="text-slate-600 dark:text-slate-400 font-medium text-lg">
					Esta pasta está vazia
				</p>
				<p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
					Volte em breve para ver novos conteúdos
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{sortedFolders.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
						Pastas
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
						{sortedFolders.map((folder) => (
							<button
								key={folder.id}
								type="button"
								onClick={() => onFolderClick(folder.id)}
								className="group flex flex-col items-center gap-3 p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 text-left"
							>
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
									<FolderOpen className="w-8 h-8 text-white" />
								</div>
								<span className="font-medium text-slate-900 dark:text-white text-sm text-center line-clamp-2 w-full">
									{folder.name}
								</span>
								<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
							</button>
						))}
					</div>
				</div>
			)}

			{sortedFiles.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
						Ficheiros
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
						{sortedFiles.map((file) => {
							const FileIcon = getFileIcon(file.mimeType);
							const showThumbnail = isImageMime(file.mimeType);
							return (
								<div
									key={file.id}
									className="group flex flex-col bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
								>
									<div className="aspect-square bg-slate-100 dark:bg-white/5 relative overflow-hidden">
										{showThumbnail ? (
											<img
												src={file.fileUrl}
												alt={file.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
													<FileIcon className="w-8 h-8 text-white" />
												</div>
											</div>
										)}
										<button
											type="button"
											onClick={() => onFileDownload(file)}
											className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 shadow-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
											title="Descarregar"
										>
											<Download className="w-5 h-5" />
										</button>
									</div>
									<div className="p-4">
										<span className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2">
											{file.name}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
