'use client';

import { FolderOpen, Loader2, Plus, UploadIcon, X } from 'lucide-react';
import { useRef, useState } from 'react';
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
import type {
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';

export function VectorLibraryAdminSection() {
	const fileInputRef = useRef<HTMLInputElement>(null);
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
					</div>
				</div>
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
		</div>
	);
}
