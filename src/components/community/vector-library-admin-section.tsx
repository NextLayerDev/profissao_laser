'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
	FolderOpen,
	FolderPlus,
	Layers,
	Loader2,
	Plus,
	UploadIcon,
	X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { VectorLibraryAdminGrid } from '@/components/community/vector-library-admin-grid';
import { VectorLibraryBreadcrumbs } from '@/components/community/vector-library-breadcrumbs';
import {
	COMMON_FORMATS,
	FileConfigFields,
} from '@/components/community/vector-library-file-config-fields';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	useBulkUpdateFiles,
	useCreateFile,
	useCreateFolder,
	useDeleteFile,
	useDeleteFolder,
	useUpdateFile,
	useUpdateFolder,
	useVectorLibraryBreadcrumbs,
	useVectorLibraryCategories,
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
	const [showEditModal, setShowEditModal] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [renameTarget, setRenameTarget] = useState<VectorLibraryFolder | null>(
		null,
	);
	const [renameValue, setRenameValue] = useState('');
	const [deleteTarget, setDeleteTarget] = useState<{
		type: 'folder' | 'file';
		item: VectorLibraryFolder | VectorLibraryFile;
	} | null>(null);

	// Upload ficheiro (+ config)
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadFileName, setUploadFileName] = useState('');
	const [uploadCategory, setUploadCategory] = useState('');
	const [uploadFormats, setUploadFormats] = useState<string[]>([]);
	const [uploadFeatured, setUploadFeatured] = useState(false);

	// Edição de ficheiro (nome + config)
	const [editTarget, setEditTarget] = useState<VectorLibraryFile | null>(null);
	const [editName, setEditName] = useState('');
	const [editCategory, setEditCategory] = useState('');
	const [editFormats, setEditFormats] = useState<string[]>([]);
	const [editFeatured, setEditFeatured] = useState(false);

	// Seleção / ação em massa
	const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
		new Set(),
	);
	const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
		new Set(),
	);
	const [showBulkModal, setShowBulkModal] = useState(false);
	const [bulkCategory, setBulkCategory] = useState('');
	const [bulkFormats, setBulkFormats] = useState<string[]>([]);
	const [bulkFeatured, setBulkFeatured] = useState<'keep' | 'set' | 'unset'>(
		'keep',
	);

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
	const { data: categories = [] } = useVectorLibraryCategories();
	const categorySuggestions = categories.map((c) => c.name);

	const createFolderMutation = useCreateFolder();
	const createFileMutation = useCreateFile();
	const updateFolderMutation = useUpdateFolder();
	const updateFileMutation = useUpdateFile();
	const deleteFolderMutation = useDeleteFolder();
	const deleteFileMutation = useDeleteFile();
	const bulkUpdateMutation = useBulkUpdateFiles();

	// Limpa a seleção ao navegar entre pastas (evita seleção "fantasma").
	// biome-ignore lint/correctness/useExhaustiveDependencies: limpar só ao trocar de pasta
	useEffect(() => {
		setSelectedFileIds(new Set());
		setSelectedFolderIds(new Set());
	}, [currentFolderId]);

	const selectionCount = selectedFileIds.size + selectedFolderIds.size;

	const toggleFile = (id: string) =>
		setSelectedFileIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const toggleFolder = (id: string) =>
		setSelectedFolderIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const clearSelection = () => {
		setSelectedFileIds(new Set());
		setSelectedFolderIds(new Set());
	};

	const selectAllVisible = () => {
		setSelectedFileIds(new Set((contents?.files ?? []).map((f) => f.id)));
		setSelectedFolderIds(new Set((contents?.folders ?? []).map((f) => f.id)));
	};

	const toggleBulkFormat = (f: string) =>
		setBulkFormats((prev) =>
			prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
		);

	const hasBulkChanges =
		bulkCategory.trim() !== '' ||
		bulkFormats.length > 0 ||
		bulkFeatured !== 'keep';

	const handleBulkApply = () => {
		if (selectionCount === 0 || !hasBulkChanges) return;
		bulkUpdateMutation.mutate(
			{
				fileIds: [...selectedFileIds],
				folderIds: [...selectedFolderIds],
				category: bulkCategory.trim() ? bulkCategory.trim() : undefined,
				addFormats: bulkFormats.length > 0 ? bulkFormats : undefined,
				featured:
					bulkFeatured === 'set'
						? true
						: bulkFeatured === 'unset'
							? false
							: undefined,
			},
			{
				onSuccess: () => {
					setShowBulkModal(false);
					setBulkCategory('');
					setBulkFormats([]);
					setBulkFeatured('keep');
					clearSelection();
				},
			},
		);
	};

	const resetUploadState = () => {
		setUploadFile(null);
		setUploadFileName('');
		setUploadCategory('');
		setUploadFormats([]);
		setUploadFeatured(false);
		setShowUploadModal(false);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

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
				config: {
					category: uploadCategory.trim() || null,
					formats: uploadFormats,
					featured: uploadFeatured,
				},
			},
			{ onSuccess: resetUploadState },
		);
	};

	const handleRename = (e: React.FormEvent) => {
		e.preventDefault();
		if (!renameTarget || !renameValue.trim()) return;
		updateFolderMutation.mutate(
			{ id: renameTarget.id, name: renameValue.trim() },
			{
				onSuccess: () => {
					setRenameTarget(null);
					setRenameValue('');
					setShowRenameModal(false);
				},
			},
		);
	};

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editTarget) return;
		updateFileMutation.mutate(
			{
				id: editTarget.id,
				data: {
					name: editName.trim() || undefined,
					category: editCategory.trim() ? editCategory.trim() : null,
					formats: editFormats,
					featured: editFeatured,
				},
			},
			{
				onSuccess: () => {
					setShowEditModal(false);
					setEditTarget(null);
				},
			},
		);
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

	const openRenameFolder = (folder: VectorLibraryFolder) => {
		setRenameTarget(folder);
		setRenameValue(folder.name);
		setShowRenameModal(true);
	};

	const openEditFile = (file: VectorLibraryFile) => {
		setEditTarget(file);
		setEditName(file.name);
		setEditCategory(file.category ?? '');
		setEditFormats(file.formats?.filter(Boolean) ?? []);
		setEditFeatured(!!file.featured);
		setShowEditModal(true);
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

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
						<div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
							<FolderOpen className="h-6 w-6 text-white" />
						</div>
						Biblioteca
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1 text-sm">
						Organize ficheiros em pastas e configure categoria, formatos e
						destaque. Os clientes com acesso à vetorização podem visualizar e
						descarregar.
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

			{/* Barra de ação em massa */}
			{selectionCount > 0 && (
				<div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10">
					<span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
						{selectionCount} selecionado(s)
					</span>
					<div className="flex-1" />
					<button
						type="button"
						onClick={selectAllVisible}
						className="px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
					>
						Selecionar tudo
					</button>
					<button
						type="button"
						onClick={() => setShowBulkModal(true)}
						className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
					>
						<Layers className="h-4 w-4" />
						Definir em massa
					</button>
					<button
						type="button"
						onClick={clearSelection}
						className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						Limpar
					</button>
				</div>
			)}

			{contentsLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
				</div>
			) : (
				<VectorLibraryAdminGrid
					folders={contents?.folders ?? []}
					files={contents?.files ?? []}
					onFolderClick={setCurrentFolderId}
					onDownload={(file) => window.open(file.fileUrl, '_blank')}
					onEditFile={openEditFile}
					onRenameFolder={openRenameFolder}
					onDeleteFolder={(f) => openDelete(f, 'folder')}
					onDeleteFile={(f) => openDelete(f, 'file')}
					selectedFileIds={selectedFileIds}
					selectedFolderIds={selectedFolderIds}
					onToggleFile={toggleFile}
					onToggleFolder={toggleFolder}
				/>
			)}

			{/* Modal Nova Pasta */}
			{showCreateFolderModal && (
				<ModalOverlay
					onClose={() => setShowCreateFolderModal(false)}
					widthClassName="max-w-md"
				>
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
				<ModalOverlay onClose={resetUploadState} widthClassName="max-w-lg">
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Upload ficheiro
							</h3>
							<button
								type="button"
								onClick={resetUploadState}
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

							<FileConfigFields
								idPrefix="upload"
								category={uploadCategory}
								onCategoryChange={setUploadCategory}
								formats={uploadFormats}
								onFormatsChange={setUploadFormats}
								featured={uploadFeatured}
								onFeaturedChange={setUploadFeatured}
								categorySuggestions={categorySuggestions}
							/>

							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={resetUploadState}
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

			{/* Modal Editar ficheiro */}
			{showEditModal && editTarget && (
				<ModalOverlay
					onClose={() => {
						setShowEditModal(false);
						setEditTarget(null);
					}}
					widthClassName="max-w-lg"
				>
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Editar vetor
							</h3>
							<button
								type="button"
								onClick={() => {
									setShowEditModal(false);
									setEditTarget(null);
								}}
								className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#252528]"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form onSubmit={handleEditSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="edit-file-name"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
								>
									Nome
								</label>
								<input
									id="edit-file-name"
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
								/>
							</div>

							<FileConfigFields
								idPrefix="edit"
								category={editCategory}
								onCategoryChange={setEditCategory}
								formats={editFormats}
								onFormatsChange={setEditFormats}
								featured={editFeatured}
								onFeaturedChange={setEditFeatured}
								categorySuggestions={categorySuggestions}
							/>

							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={() => {
										setShowEditModal(false);
										setEditTarget(null);
									}}
									className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={!editName.trim() || updateFileMutation.isPending}
									className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
								>
									Guardar
								</button>
							</div>
						</form>
					</div>
				</ModalOverlay>
			)}

			{/* Modal Definir em massa */}
			{showBulkModal && (
				<ModalOverlay
					onClose={() => setShowBulkModal(false)}
					widthClassName="max-w-lg"
				>
					<div className="p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Definir em massa
							</h3>
							<button
								type="button"
								onClick={() => setShowBulkModal(false)}
								className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#252528]"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<p className="text-sm text-slate-500 dark:text-gray-400 mb-5">
							Aplicado a{' '}
							<span className="font-semibold text-slate-700 dark:text-slate-300">
								{selectedFileIds.size} ficheiro(s)
							</span>{' '}
							e{' '}
							<span className="font-semibold text-slate-700 dark:text-slate-300">
								{selectedFolderIds.size} pasta(s)
							</span>
							. As pastas incluem todos os ficheiros dentro (subpastas
							inclusas).
						</p>

						<div className="space-y-4">
							{/* Categoria */}
							<div>
								<label
									htmlFor="bulk-category"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
								>
									Categoria
								</label>
								<input
									id="bulk-category"
									type="text"
									list="bulk-category-list"
									value={bulkCategory}
									onChange={(e) => setBulkCategory(e.target.value)}
									placeholder="Deixe vazio para não alterar"
									className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
								/>
								{categorySuggestions.length > 0 && (
									<datalist id="bulk-category-list">
										{categorySuggestions.map((c) => (
											<option key={c} value={c} />
										))}
									</datalist>
								)}
							</div>

							{/* Formatos (merge) */}
							<div>
								<span className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
									Formatos (adicionar)
								</span>
								<div className="flex flex-wrap gap-2">
									{COMMON_FORMATS.map((f) => {
										const active = bulkFormats.includes(f);
										return (
											<button
												key={f}
												type="button"
												onClick={() => toggleBulkFormat(f)}
												className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-colors ${
													active
														? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
														: 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-emerald-500/50'
												}`}
											>
												{f}
											</button>
										);
									})}
								</div>
								<p className="text-xs text-slate-500 dark:text-gray-500 mt-1.5">
									Somados aos formatos já existentes (não remove nada).
								</p>
							</div>

							{/* Destaque */}
							<div>
								<label
									htmlFor="bulk-featured"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
								>
									Destaque
								</label>
								<select
									id="bulk-featured"
									value={bulkFeatured}
									onChange={(e) =>
										setBulkFeatured(e.target.value as 'keep' | 'set' | 'unset')
									}
									className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
								>
									<option value="keep">Não alterar</option>
									<option value="set">Marcar como destaque</option>
									<option value="unset">Remover destaque</option>
								</select>
							</div>
						</div>

						<div className="flex gap-3 pt-5">
							<button
								type="button"
								onClick={() => setShowBulkModal(false)}
								className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleBulkApply}
								disabled={!hasBulkChanges || bulkUpdateMutation.isPending}
								className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
							>
								Aplicar
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}

			{/* Modal Renomear pasta */}
			{showRenameModal && renameTarget && (
				<ModalOverlay
					onClose={() => {
						setShowRenameModal(false);
						setRenameTarget(null);
						setRenameValue('');
					}}
					widthClassName="max-w-md"
				>
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Renomear pasta
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
										!renameValue.trim() || updateFolderMutation.isPending
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
					widthClassName="max-w-md"
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
					widthClassName="max-w-md"
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
