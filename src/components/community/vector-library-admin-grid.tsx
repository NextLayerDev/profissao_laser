'use client';

import {
	ChevronRight,
	Download,
	FolderOpen,
	Pencil,
	Star,
	Trash2,
} from 'lucide-react';
import type {
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';
import { formatDate } from '@/utils/formatDate';
import {
	formatFileSize,
	getFileIcon,
	isImageMime,
} from '@/utils/vector-library';

interface VectorLibraryAdminGridProps {
	folders: VectorLibraryFolder[];
	files: VectorLibraryFile[];
	onFolderClick: (id: string) => void;
	onDownload: (file: VectorLibraryFile) => void;
	onEditFile: (file: VectorLibraryFile) => void;
	onRenameFolder: (folder: VectorLibraryFolder) => void;
	onDeleteFolder: (folder: VectorLibraryFolder) => void;
	onDeleteFile: (file: VectorLibraryFile) => void;
	selectedFileIds: Set<string>;
	selectedFolderIds: Set<string>;
	onToggleFile: (id: string) => void;
	onToggleFolder: (id: string) => void;
}

export function VectorLibraryAdminGrid({
	folders,
	files,
	onFolderClick,
	onDownload,
	onEditFile,
	onRenameFolder,
	onDeleteFolder,
	onDeleteFile,
	selectedFileIds,
	selectedFolderIds,
	onToggleFile,
	onToggleFolder,
}: VectorLibraryAdminGridProps) {
	const sortedFolders = [...folders].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	);
	const sortedFiles = [...files].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	);

	if (sortedFolders.length === 0 && sortedFiles.length === 0) {
		return (
			<div className="text-center py-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
				<FolderOpen className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4 opacity-50" />
				<p className="text-slate-600 dark:text-slate-400 font-medium">
					Esta pasta está vazia
				</p>
				<p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
					Crie uma pasta ou faça upload de ficheiros
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Pastas — lista enxuta */}
			{sortedFolders.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
						Pastas
					</h3>
					<div className="space-y-2">
						{sortedFolders.map((folder) => (
							<div
								key={folder.id}
								className={`group flex items-center gap-3 p-3 bg-white dark:bg-[#1a1a1d] border rounded-xl transition-colors ${
									selectedFolderIds.has(folder.id)
										? 'border-emerald-500 ring-1 ring-emerald-500/40'
										: 'border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/40'
								}`}
							>
								<input
									type="checkbox"
									checked={selectedFolderIds.has(folder.id)}
									onChange={() => onToggleFolder(folder.id)}
									aria-label={`Selecionar pasta ${folder.name}`}
									className="w-4 h-4 shrink-0 rounded border-slate-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500/40 cursor-pointer"
								/>
								<button
									type="button"
									onClick={() => onFolderClick(folder.id)}
									className="flex items-center gap-3 flex-1 min-w-0 text-left"
								>
									<div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
										<FolderOpen className="h-5 w-5" />
									</div>
									<span className="font-medium text-slate-900 dark:text-white truncate">
										{folder.name}
									</span>
									<ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
								</button>
								<span className="text-xs text-slate-500 dark:text-gray-500 hidden sm:block shrink-0">
									{formatDate(folder.createdAt)}
								</span>
								<div className="flex items-center gap-1 shrink-0">
									<button
										type="button"
										onClick={() => onRenameFolder(folder)}
										title="Renomear"
										className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/5"
									>
										<Pencil className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => onDeleteFolder(folder)}
										title="Excluir"
										className="p-2 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Ficheiros — cards com thumbnail */}
			{sortedFiles.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
						Vetores
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
						{sortedFiles.map((file) => {
							const showThumbnail = isImageMime(file.mimeType);
							const FileIcon = getFileIcon(file.mimeType);
							const fileFormats = file.formats?.filter(Boolean) ?? [];

							return (
								<div
									key={file.id}
									className={`group flex flex-col bg-white dark:bg-[#1a1a1d] border rounded-2xl overflow-hidden transition-all duration-200 ${
										selectedFileIds.has(file.id)
											? 'border-emerald-500 ring-1 ring-emerald-500/40'
											: 'border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5'
									}`}
								>
									{/* Thumbnail */}
									<div className="aspect-square bg-slate-50 dark:bg-[#141416] relative overflow-hidden">
										{/* Selection checkbox */}
										<label className="absolute top-2 left-2 z-10 flex items-center justify-center w-6 h-6 rounded-md bg-white/90 dark:bg-slate-900/80 shadow cursor-pointer">
											<input
												type="checkbox"
												checked={selectedFileIds.has(file.id)}
												onChange={() => onToggleFile(file.id)}
												aria-label={`Selecionar ${file.name}`}
												className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500/40 cursor-pointer"
											/>
										</label>
										{showThumbnail ? (
											<img
												src={file.fileUrl}
												alt={file.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
													<FileIcon className="h-7 w-7 text-white" />
												</div>
											</div>
										)}

										{/* Featured star */}
										{file.featured && (
											<span
												className="absolute top-2 right-2 p-1.5 rounded-lg bg-amber-500/90 text-white shadow-md"
												title="Destaque"
											>
												<Star className="h-3.5 w-3.5 fill-current" />
											</span>
										)}

										{/* Formats badge (bottom para não colidir com o checkbox) */}
										{fileFormats.length > 0 && (
											<span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-900/70 text-white">
												{fileFormats[0]}
												{fileFormats.length > 1 &&
													` +${fileFormats.length - 1}`}
											</span>
										)}
									</div>

									{/* Info */}
									<div className="p-3 flex-1">
										<p className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2">
											{file.name}
										</p>
										<div className="mt-1 flex items-center gap-2 flex-wrap">
											{file.category ? (
												<span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
													{file.category}
												</span>
											) : (
												<span className="text-xs text-slate-400 dark:text-gray-600 italic">
													Sem categoria
												</span>
											)}
											<span className="text-[10px] text-slate-400 dark:text-gray-600">
												{formatFileSize(file.size)}
											</span>
										</div>
									</div>

									{/* Actions */}
									<div className="flex border-t border-slate-100 dark:border-white/5">
										<button
											type="button"
											onClick={() => onEditFile(file)}
											className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
										>
											<Pencil className="h-3.5 w-3.5" />
											Editar
										</button>
										<button
											type="button"
											onClick={() => onDownload(file)}
											title="Descarregar"
											className="px-3 py-2 border-l border-slate-100 dark:border-white/5 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
										>
											<Download className="h-4 w-4" />
										</button>
										<button
											type="button"
											onClick={() => onDeleteFile(file)}
											title="Excluir"
											className="px-3 py-2 border-l border-slate-100 dark:border-white/5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
										>
											<Trash2 className="h-4 w-4" />
										</button>
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
