'use client';

import {
	ChevronRight,
	Download,
	FolderOpen,
	MoreVertical,
	Pencil,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type {
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';
import { formatDate } from '@/utils/formatDate';
import {
	formatFileSize,
	getFileIcon,
	getFileTypeLabel,
} from '@/utils/vector-library';

interface VectorLibraryTableProps {
	folders: VectorLibraryFolder[];
	files: VectorLibraryFile[];
	onFolderClick: (folderId: string) => void;
	onFileDownload: (file: VectorLibraryFile) => void;
	isAdmin?: boolean;
	onRenameFolder?: (folder: VectorLibraryFolder) => void;
	onRenameFile?: (file: VectorLibraryFile) => void;
	onDeleteFolder?: (folder: VectorLibraryFolder) => void;
	onDeleteFile?: (file: VectorLibraryFile) => void;
}

export function VectorLibraryTable({
	folders,
	files,
	onFolderClick,
	onFileDownload,
	isAdmin = false,
	onRenameFolder,
	onRenameFile,
	onDeleteFolder,
	onDeleteFile,
}: VectorLibraryTableProps) {
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);

	const sortedFolders = [...folders].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	);
	const sortedFiles = [...files].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
	);

	const hasItems = sortedFolders.length > 0 || sortedFiles.length > 0;

	if (!hasItems) {
		return (
			<div className="text-center py-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
				<FolderOpen className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4 opacity-50" />
				<p className="text-slate-600 dark:text-slate-400 font-medium">
					Esta pasta está vazia
				</p>
				<p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
					{isAdmin
						? 'Crie uma pasta ou faça upload de ficheiros'
						: 'Volte em breve para ver novos conteúdos'}
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
			<table className="w-full">
				<thead>
					<tr className="border-b border-slate-200 dark:border-white/10">
						<th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
							Nome
						</th>
						<th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
							Tipo
						</th>
						<th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
							Tamanho
						</th>
						<th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
							Data
						</th>
						{isAdmin && <th className="w-12 py-4 px-2" aria-label="Ações" />}
						{!isAdmin && <th className="w-24 py-4 px-2" aria-label="Ações" />}
					</tr>
				</thead>
				<tbody>
					{sortedFolders.map((folder) => (
						<tr
							key={folder.id}
							className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
						>
							<td className="py-3 px-6">
								<button
									type="button"
									onClick={() => onFolderClick(folder.id)}
									className="flex items-center gap-3 text-left w-full hover:text-emerald-600 dark:hover:text-emerald-400"
								>
									<div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
										<FolderOpen className="h-5 w-5" />
									</div>
									<span className="font-medium text-slate-900 dark:text-white truncate">
										{folder.name}
									</span>
									<ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
								</button>
							</td>
							<td className="py-3 px-6 text-slate-500 dark:text-slate-400 text-sm hidden sm:table-cell">
								Pasta
							</td>
							<td className="py-3 px-6 text-slate-500 dark:text-slate-400 text-sm hidden md:table-cell">
								—
							</td>
							<td className="py-3 px-6 text-slate-500 dark:text-slate-400 text-sm hidden lg:table-cell">
								{formatDate(folder.createdAt)}
							</td>
							{isAdmin && onRenameFolder && onDeleteFolder && (
								<td className="py-3 px-2">
									<div className="relative">
										<button
											type="button"
											onClick={() =>
												setOpenMenuId(
													openMenuId === folder.id ? null : folder.id,
												)
											}
											className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<MoreVertical className="h-4 w-4" />
										</button>
										{openMenuId === folder.id && (
											<>
												<div
													className="fixed inset-0 z-10"
													aria-hidden
													onClick={() => setOpenMenuId(null)}
												/>
												<div className="absolute right-0 top-full mt-1 z-20 py-1 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg min-w-[140px]">
													<button
														type="button"
														onClick={() => {
															onRenameFolder(folder);
															setOpenMenuId(null);
														}}
														className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
													>
														<Pencil className="h-4 w-4" />
														Renomear
													</button>
													<button
														type="button"
														onClick={() => {
															onDeleteFolder(folder);
															setOpenMenuId(null);
														}}
														className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
													>
														<Trash2 className="h-4 w-4" />
														Excluir
													</button>
												</div>
											</>
										)}
									</div>
								</td>
							)}
							{!isAdmin && <td className="py-3 px-2" />}
						</tr>
					))}
					{sortedFiles.map((file) => {
						const FileIcon = getFileIcon(file.mimeType);
						return (
							<tr
								key={file.id}
								className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
							>
								<td className="py-3 px-6">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
											<FileIcon className="h-5 w-5" />
										</div>
										<span className="font-medium text-slate-900 dark:text-white truncate">
											{file.name}
										</span>
									</div>
								</td>
								<td className="py-3 px-6 text-slate-500 dark:text-slate-400 text-sm hidden sm:table-cell">
									{getFileTypeLabel(file.mimeType)}
								</td>
								<td className="py-3 px-6 text-slate-500 dark:text-slate-400 text-sm hidden md:table-cell">
									{formatFileSize(file.size)}
								</td>
								<td className="py-3 px-6 text-slate-500 dark:text-slate-400 text-sm hidden lg:table-cell">
									{formatDate(file.createdAt)}
								</td>
								<td className="py-3 px-2">
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => onFileDownload(file)}
											className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
											title="Descarregar"
										>
											<Download className="h-4 w-4" />
										</button>
										{isAdmin && onRenameFile && onDeleteFile && (
											<div className="relative">
												<button
													type="button"
													onClick={() =>
														setOpenMenuId(
															openMenuId === file.id ? null : file.id,
														)
													}
													className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<MoreVertical className="h-4 w-4" />
												</button>
												{openMenuId === file.id && (
													<>
														<div
															className="fixed inset-0 z-10"
															aria-hidden
															onClick={() => setOpenMenuId(null)}
														/>
														<div className="absolute right-0 top-full mt-1 z-20 py-1 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg min-w-[140px]">
															<button
																type="button"
																onClick={() => {
																	onRenameFile(file);
																	setOpenMenuId(null);
																}}
																className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
															>
																<Pencil className="h-4 w-4" />
																Renomear
															</button>
															<button
																type="button"
																onClick={() => {
																	onDeleteFile(file);
																	setOpenMenuId(null);
																}}
																className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
															>
																<Trash2 className="h-4 w-4" />
																Excluir
															</button>
														</div>
													</>
												)}
											</div>
										)}
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
