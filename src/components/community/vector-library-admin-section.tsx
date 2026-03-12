'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	FolderOpen,
	FolderPlus,
	Loader2,
	Plus,
	UploadIcon,
	X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { VectorLibraryBreadcrumbs } from '@/components/community/vector-library-breadcrumbs';
import { VectorLibraryTable } from '@/components/community/vector-library-table';
import {
	useCreateFile,
	useCreateFolder,
	useDeleteFile,
	useDeleteFolder,
	useUpdateFile,
	useUpdateFolder,
	useVectorLibraryBreadcrumbs,
	useVectorLibraryContents,
} from '@/hooks/use-vector-library';
import { uploadFolderStructure } from '@/services/vector-library';
import type {
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';
import { getFilesFromDroppedFolder } from '@/utils/vector-library-folder-upload';

export function VectorLibraryAdminSection() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const folderInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showRenameModal, setShowRenameModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [renameTarget, setRenameTarget] = useState<{
		type: 'folder' | 'file';
		item: VectorLibraryFolder | VectorLibraryFile;
	} | null>(null);
	const [renameValue, setRenameValue] = useState('');
	const [deleteTarget, setDeleteTarget] = useState<{
		type: 'folder' | 'file';
		item: VectorLibraryFolder | VectorLibraryFile;
	} | null>(null);
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadFileName, setUploadFileName] = useState('');
	const [showUploadFolderModal, setShowUploadFolderModal] = useState(false);
	const [uploadFolderState, setUploadFolderState] = useState<
		'idle' | 'uploading' | 'success' | 'error'
	>('idle');
	const [uploadFolderProgress, setUploadFolderProgress] = useState({
		done: 0,
		total: 0,
		phase: 'folders' as 'folders' | 'files',
		current: '',
	});
	const [uploadFolderResult, setUploadFolderResult] = useState<{
		foldersCreated: number;
		filesUploaded: number;
		filesFailed: { name: string; error: string }[];
	} | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);

	const { data: contents, isLoading: contentsLoading } =
		useVectorLibraryContents(currentFolderId);
	const { data: breadcrumbs = [] } =
		useVectorLibraryBreadcrumbs(currentFolderId);

	const createFolderMutation = useCreateFolder();
	const createFileMutation = useCreateFile();
	const updateFolderMutation = useUpdateFolder();
	const updateFileMutation = useUpdateFile();
	const deleteFolderMutation = useDeleteFolder();
	const deleteFileMutation = useDeleteFile();

	const handleCreateFolder = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newFolderName.trim()) return;
		createFolderMutation.mutate(
			{ name: newFolderName.trim(), parentId: currentFolderId },
			{
				onSuccess: () => {
					setNewFolderName('');
					setShowCreateFolderModal(false);
				},
			},
		);
	};

	const handleUpload = (e: React.FormEvent) => {
		e.preventDefault();
		if (!uploadFile) return;
		createFileMutation.mutate(
			{
				file: uploadFile,
				folderId: currentFolderId,
				name: uploadFileName.trim() || undefined,
			},
			{
				onSuccess: () => {
					setUploadFile(null);
					setUploadFileName('');
					setShowUploadModal(false);
					if (fileInputRef.current) fileInputRef.current.value = '';
				},
			},
		);
	};

	const handleRename = (e: React.FormEvent) => {
		e.preventDefault();
		if (!renameTarget || !renameValue.trim()) return;
		if (renameTarget.type === 'folder') {
			updateFolderMutation.mutate(
				{ id: renameTarget.item.id, name: renameValue.trim() },
				{
					onSuccess: () => {
						setRenameTarget(null);
						setRenameValue('');
						setShowRenameModal(false);
					},
				},
			);
		} else {
			updateFileMutation.mutate(
				{ id: renameTarget.item.id, name: renameValue.trim() },
				{
					onSuccess: () => {
						setRenameTarget(null);
						setRenameValue('');
						setShowRenameModal(false);
					},
				},
			);
		}
	};

	const handleDelete = () => {
		if (!deleteTarget) return;
		if (deleteTarget.type === 'folder') {
			deleteFolderMutation.mutate(deleteTarget.item.id, {
				onSuccess: () => {
					setDeleteTarget(null);
					setShowDeleteModal(false);
				},
			});
		} else {
			deleteFileMutation.mutate(deleteTarget.item.id, {
				onSuccess: () => {
					setDeleteTarget(null);
					setShowDeleteModal(false);
				},
			});
		}
	};

	const openRename = (
		item: VectorLibraryFolder | VectorLibraryFile,
		type: 'folder' | 'file',
	) => {
		setRenameTarget({ type, item });
		setRenameValue(item.name);
		setShowRenameModal(true);
	};

	const openDelete = (
		item: VectorLibraryFolder | VectorLibraryFile,
		type: 'folder' | 'file',
	) => {
		setDeleteTarget({ type, item });
		setShowDeleteModal(true);
	};

	const handleUploadFolder = async (files: FileList | File[] | null) => {
		const fileArray = files ? Array.from(files) : [];
		if (fileArray.length === 0) {
			toast.error('Selecione uma pasta com ficheiros');
			return;
		}
		setShowUploadFolderModal(true);
		setUploadFolderState('uploading');
		setUploadFolderProgress({
			done: 0,
			total: fileArray.length,
			phase: 'folders',
			current: '',
		});
		setUploadFolderResult(null);

		try {
			const result = await uploadFolderStructure(
				fileArray,
				currentFolderId,
				(done, total, phase, current) => {
					setUploadFolderProgress({
						done,
						total,
						phase,
						current: current ?? '',
					});
				},
			);
			setUploadFolderResult(result);
			setUploadFolderState('success');
			queryClient.invalidateQueries({ queryKey: ['vector-library'] });
			if (result.filesFailed.length > 0) {
				toast.warning(
					`${result.filesUploaded}/${fileArray.length} ficheiros enviados. ${result.filesFailed.length} falharam.`,
				);
			} else {
				toast.success(
					`${result.foldersCreated} pastas criadas, ${result.filesUploaded} ficheiros enviados.`,
				);
			}
		} catch (err) {
			setUploadFolderState('error');
			const msg = err instanceof Error ? err.message : String(err);
			toast.error(`Erro ao enviar pasta: ${msg}`);
		} finally {
			if (folderInputRef.current) folderInputRef.current.value = '';
		}
	};

	const handleFolderDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		if (uploadFolderState === 'uploading') return;
		const items = e.dataTransfer?.items;
		if (!items?.length) return;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.kind !== 'file') continue;
			const entry =
				item.webkitGetAsEntry?.() ??
				(
					item as { getAsEntry?: () => { isDirectory: boolean } }
				).getAsEntry?.();
			if (!entry?.isDirectory) continue;
			try {
				const files = await getFilesFromDroppedFolder(item);
				if (files.length > 0) {
					await handleUploadFolder(files);
					return;
				}
			} catch (_err) {
				toast.error('Erro ao processar pasta arrastada');
				return;
			}
		}
		toast.error('Arraste uma pasta (não ficheiros individuais)');
	};

	const handleFolderDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = 'copy';
		setIsDragOver(true);
	};

	const handleFolderDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDragOver(false);
		}
	};

	const ModalOverlay = ({
		onClose,
		children,
	}: {
		onClose: () => void;
		children: React.ReactNode;
	}) => (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm"
			onClick={(e) => e.target === e.currentTarget && onClose()}
			onKeyDown={(e) => e.key === 'Escape' && onClose()}
			role="dialog"
			aria-modal="true"
			aria-label="Fechar"
		>
			<div
				className="relative z-10 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full"
				role="document"
			>
				{children}
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
						<div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
							<FolderOpen className="h-6 w-6 text-white" />
						</div>
						Biblioteca de Vetores
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1 text-sm">
						Organize ficheiros em pastas. Os clientes com acesso à vetorização
						podem visualizar e descarregar.
					</p>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<VectorLibraryBreadcrumbs
						items={breadcrumbs}
						onNavigate={setCurrentFolderId}
					/>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setShowCreateFolderModal(true)}
							className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl"
						>
							<Plus className="h-4 w-4" />
							Nova pasta
						</button>
						<button
							type="button"
							onClick={() => setShowUploadModal(true)}
							className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl"
						>
							<UploadIcon className="h-4 w-4" />
							Upload ficheiro
						</button>
						<button
							type="button"
							onClick={() => folderInputRef.current?.click()}
							disabled={
								showUploadFolderModal && uploadFolderState === 'uploading'
							}
							className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl disabled:opacity-50"
						>
							<FolderPlus className="h-4 w-4" />
							Upload pasta
						</button>
						<input
							ref={(el) => {
								folderInputRef.current = el;
								if (el) {
									el.setAttribute('webkitdirectory', '');
									el.setAttribute('directory', '');
								}
							}}
							type="file"
							onChange={(e) => handleUploadFolder(e.target.files)}
							className="hidden"
						/>
					</div>
				</div>

				{/* Zona de drop para pasta */}
				<button
					type="button"
					onClick={() => {
						if (uploadFolderState !== 'uploading')
							folderInputRef.current?.click();
					}}
					onDrop={handleFolderDrop}
					onDragOver={handleFolderDragOver}
					onDragLeave={handleFolderDragLeave}
					disabled={uploadFolderState === 'uploading'}
					className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-6 text-center transition-all ${
						uploadFolderState === 'uploading'
							? 'border-slate-200 dark:border-gray-700 cursor-not-allowed opacity-60'
							: isDragOver
								? 'border-amber-500 bg-amber-500/10 cursor-pointer'
								: 'border-slate-300 dark:border-gray-600 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer'
					}`}
				>
					<FolderPlus className="h-10 w-10 text-amber-500 mb-2 opacity-80" />
					<span className="text-sm font-medium text-slate-700 dark:text-gray-300">
						Arraste uma pasta aqui ou clique para selecionar
					</span>
					<span className="text-xs text-slate-500 dark:text-gray-500 mt-1">
						A estrutura de pastas e ficheiros será mantida
					</span>
				</button>
			</div>

			{contentsLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
				</div>
			) : (
				<VectorLibraryTable
					folders={contents?.folders ?? []}
					files={contents?.files ?? []}
					onFolderClick={setCurrentFolderId}
					onFileDownload={(file) => window.open(file.fileUrl, '_blank')}
					isAdmin
					onRenameFolder={(f) => openRename(f, 'folder')}
					onRenameFile={(f) => openRename(f, 'file')}
					onDeleteFolder={(f) => openDelete(f, 'folder')}
					onDeleteFile={(f) => openDelete(f, 'file')}
				/>
			)}

			{/* Modal Nova Pasta */}
			{showCreateFolderModal && (
				<ModalOverlay onClose={() => setShowCreateFolderModal(false)}>
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Nova pasta
							</h3>
							<button
								type="button"
								onClick={() => setShowCreateFolderModal(false)}
								className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#252528]"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form onSubmit={handleCreateFolder} className="space-y-4">
							<div>
								<label
									htmlFor="create-folder-name"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
								>
									Nome da pasta
								</label>
								<input
									id="create-folder-name"
									type="text"
									value={newFolderName}
									onChange={(e) => setNewFolderName(e.target.value)}
									placeholder="Ex: Pack Vetores"
									className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
								/>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setShowCreateFolderModal(false)}
									className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={
										!newFolderName.trim() || createFolderMutation.isPending
									}
									className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
								>
									Criar
								</button>
							</div>
						</form>
					</div>
				</ModalOverlay>
			)}

			{/* Modal Upload */}
			{showUploadModal && (
				<ModalOverlay onClose={() => setShowUploadModal(false)}>
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Upload ficheiro
							</h3>
							<button
								type="button"
								onClick={() => setShowUploadModal(false)}
								className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#252528]"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form onSubmit={handleUpload} className="space-y-4">
							<div>
								<label
									htmlFor="upload-file-input"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
								>
									Ficheiro
								</label>
								<input
									id="upload-file-input"
									ref={fileInputRef}
									type="file"
									accept="*/*"
									onChange={(e) => {
										const f = e.target.files?.[0];
										setUploadFile(f ?? null);
										setUploadFileName(f?.name ?? '');
									}}
									className="hidden"
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="w-full border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
								>
									<UploadIcon className="h-10 w-10 text-slate-400 mx-auto mb-2" />
									<p className="text-sm text-slate-600 dark:text-gray-400">
										{uploadFile
											? uploadFile.name
											: 'Clique para selecionar um ficheiro'}
									</p>
								</button>
							</div>
							<div>
								<label
									htmlFor="upload-file-name"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
								>
									Nome (opcional)
								</label>
								<input
									id="upload-file-name"
									type="text"
									value={uploadFileName}
									onChange={(e) => setUploadFileName(e.target.value)}
									placeholder="Deixe vazio para usar o nome do ficheiro"
									className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
								/>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setShowUploadModal(false)}
									className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={!uploadFile || createFileMutation.isPending}
									className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
								>
									Upload
								</button>
							</div>
						</form>
					</div>
				</ModalOverlay>
			)}

			{/* Modal Renomear */}
			{showRenameModal && renameTarget && (
				<ModalOverlay
					onClose={() => {
						setShowRenameModal(false);
						setRenameTarget(null);
						setRenameValue('');
					}}
				>
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Renomear
							</h3>
							<button
								type="button"
								onClick={() => {
									setShowRenameModal(false);
									setRenameTarget(null);
									setRenameValue('');
								}}
								className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#252528]"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form onSubmit={handleRename} className="space-y-4">
							<div>
								<label
									htmlFor="rename-input"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
								>
									Nome
								</label>
								<input
									id="rename-input"
									type="text"
									value={renameValue}
									onChange={(e) => setRenameValue(e.target.value)}
									className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
								/>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => {
										setShowRenameModal(false);
										setRenameTarget(null);
										setRenameValue('');
									}}
									className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={
										!renameValue.trim() ||
										updateFolderMutation.isPending ||
										updateFileMutation.isPending
									}
									className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
								>
									Guardar
								</button>
							</div>
						</form>
					</div>
				</ModalOverlay>
			)}

			{/* Modal Excluir */}
			{showDeleteModal && deleteTarget && (
				<ModalOverlay
					onClose={() => {
						setShowDeleteModal(false);
						setDeleteTarget(null);
					}}
				>
					<div className="p-6">
						<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
							Excluir {deleteTarget.type === 'folder' ? 'pasta' : 'ficheiro'}?
						</h3>
						<p className="text-slate-600 dark:text-gray-400 text-sm mb-6">
							{deleteTarget.type === 'folder'
								? `A pasta "${deleteTarget.item.name}" e todo o seu conteúdo serão excluídos. Esta ação não pode ser desfeita.`
								: `O ficheiro "${deleteTarget.item.name}" será excluído. Esta ação não pode ser desfeita.`}
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => {
									setShowDeleteModal(false);
									setDeleteTarget(null);
								}}
								className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={
									deleteFolderMutation.isPending || deleteFileMutation.isPending
								}
								className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium"
							>
								Excluir
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}

			{/* Modal Upload Pasta */}
			{showUploadFolderModal && (
				<ModalOverlay
					onClose={() => {
						if (uploadFolderState !== 'uploading') {
							setShowUploadFolderModal(false);
							setUploadFolderState('idle');
							setUploadFolderResult(null);
						}
					}}
				>
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Upload de pasta
							</h3>
							{uploadFolderState !== 'uploading' && (
								<button
									type="button"
									onClick={() => {
										setShowUploadFolderModal(false);
										setUploadFolderState('idle');
										setUploadFolderResult(null);
									}}
									className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#252528]"
								>
									<X className="h-5 w-5" />
								</button>
							)}
						</div>

						{uploadFolderState === 'uploading' && (
							<div className="space-y-4">
								<p className="text-sm text-slate-600 dark:text-gray-400">
									{uploadFolderProgress.phase === 'folders'
										? `A criar pastas... ${uploadFolderProgress.done}/${uploadFolderProgress.total}`
										: `A enviar ficheiros... ${uploadFolderProgress.done}/${uploadFolderProgress.total}`}
								</p>
								{uploadFolderProgress.current && (
									<p className="text-xs text-slate-500 dark:text-gray-500 truncate">
										{uploadFolderProgress.current}
									</p>
								)}
								<div className="h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
									<div
										className="h-full bg-emerald-500 transition-all duration-300"
										style={{
											width:
												uploadFolderProgress.total > 0
													? `${(uploadFolderProgress.done / uploadFolderProgress.total) * 100}%`
													: '0%',
										}}
									/>
								</div>
								<div className="flex justify-center">
									<Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
								</div>
							</div>
						)}

						{uploadFolderState === 'success' && uploadFolderResult && (
							<div className="space-y-4">
								<div className="text-sm text-slate-600 dark:text-gray-400">
									<p>
										{uploadFolderResult.foldersCreated} pastas criadas,{' '}
										{uploadFolderResult.filesUploaded} ficheiros enviados.
									</p>
									{uploadFolderResult.filesFailed.length > 0 && (
										<div className="mt-3 space-y-1 text-amber-600 dark:text-amber-400 text-sm">
											<p className="font-medium">
												{uploadFolderResult.filesFailed.length} ficheiros
												falharam:
											</p>
											<ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
												{uploadFolderResult.filesFailed.map((f) => (
													<li key={f.name} title={f.error}>
														{f.name}
														{f.error && (
															<span className="block text-xs text-slate-500 dark:text-gray-500 truncate ml-4">
																{f.error}
															</span>
														)}
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
								<button
									type="button"
									onClick={() => {
										setShowUploadFolderModal(false);
										setUploadFolderState('idle');
										setUploadFolderResult(null);
									}}
									className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
								>
									Fechar
								</button>
							</div>
						)}

						{uploadFolderState === 'error' && (
							<div className="space-y-4">
								<p className="text-sm text-red-600 dark:text-red-400">
									Ocorreu um erro ao enviar a pasta. Tente novamente.
								</p>
								<button
									type="button"
									onClick={() => {
										setShowUploadFolderModal(false);
										setUploadFolderState('idle');
										setUploadFolderResult(null);
									}}
									className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
								>
									Fechar
								</button>
							</div>
						)}
					</div>
				</ModalOverlay>
			)}
		</div>
	);
}
