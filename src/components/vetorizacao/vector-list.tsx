'use client';

import {
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Download,
	Edit3,
	Loader2,
	Search,
	Trash2,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useDeleteCustomerVector, useUpdateVector } from '@/hooks/use-vectors';
import { vectorizeImage } from '@/services/vectorize';
import type { CustomerVector } from '@/services/vectors';
import { formatDate } from '@/utils/formatDate';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

async function downloadFromUrl(url: string, filename: string) {
	const res = await fetch(url);
	const text = await res.text();
	const blob = new Blob([text], { type: 'image/svg+xml' });
	const blobUrl = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = blobUrl;
	a.download = filename.endsWith('.svg')
		? filename
		: `${filename.replace(/\.[^.]+$/, '') || 'vector'}.svg`;
	a.click();
	URL.revokeObjectURL(blobUrl);
}

interface VectorListProps {
	data: CustomerVector[];
	total: number;
	page: number;
	limit: number;
	search: string;
	onPageChange: (page: number) => void;
	onSearchChange: (search: string) => void;
	onRefetch: () => void;
}

export function VectorList({
	data,
	total,
	page,
	limit,
	search,
	onPageChange,
	onSearchChange,
	onRefetch,
}: VectorListProps) {
	const [searchInput, setSearchInput] = useState(search);
	const [editModal, setEditModal] = useState<CustomerVector | null>(null);
	const [editName, setEditName] = useState('');
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
	const [replaceFile, setReplaceFile] = useState<File | null>(null);
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	const updateMutation = useUpdateVector();
	const deleteMutation = useDeleteCustomerVector();

	// Debounce search
	useEffect(() => {
		const t = setTimeout(() => onSearchChange(searchInput), 300);
		return () => clearTimeout(t);
	}, [searchInput, onSearchChange]);

	// Sync search input when parent search changes (e.g. after reset)
	useEffect(() => {
		setSearchInput(search);
	}, [search]);

	const openEdit = useCallback((v: CustomerVector) => {
		setEditModal(v);
		setEditName(v.original_name);
		setReplaceFile(null);
	}, []);

	const handleSaveEdit = useCallback(async () => {
		if (!editModal) return;
		setIsSavingEdit(true);
		try {
			const payload: { originalName?: string; svgContent?: string } = {};
			if (editName !== editModal.original_name) payload.originalName = editName;
			if (replaceFile) {
				const result = await vectorizeImage(replaceFile);
				payload.svgContent = result.svgContent;
			}
			if (Object.keys(payload).length === 0) {
				setEditModal(null);
				return;
			}
			await updateMutation.mutateAsync({ id: editModal.id, payload });
			setEditModal(null);
			onRefetch();
		} catch {
			// toast pelo mutation ou fetch
		} finally {
			setIsSavingEdit(false);
		}
	}, [editModal, editName, replaceFile, updateMutation, onRefetch]);

	const handleDelete = useCallback(
		async (id: string) => {
			await deleteMutation.mutateAsync(id);
			setDeleteConfirm(null);
			onRefetch();
		},
		[deleteMutation, onRefetch],
	);

	const totalPages = Math.ceil(total / limit) || 1;
	const hasPrev = page > 1;
	const hasNext = page < totalPages;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-end gap-4 flex-wrap">
				<div className="flex items-center gap-2">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Buscar por nome..."
							className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
						/>
					</div>
				</div>
			</div>

			{data.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-12 text-center">
					<BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-slate-400">
						{search
							? 'Nenhum vetor encontrado.'
							: 'Ainda não tem vetores guardados.'}
					</p>
					{search && (
						<button
							type="button"
							onClick={() => setSearchInput('')}
							className="mt-2 text-violet-500 hover:text-violet-400 text-sm"
						>
							Limpar busca
						</button>
					)}
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{data.map((v) => (
							<div
								key={v.id}
								className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 overflow-hidden"
							>
								<div className="aspect-square relative bg-slate-100 dark:bg-white/5 rounded-lg mb-3">
									<Image
										src={v.svg_url}
										alt={v.original_name}
										fill
										className="object-contain p-2"
										unoptimized
									/>
								</div>
								<p className="font-medium text-slate-900 dark:text-white truncate text-sm">
									{v.original_name}
								</p>
								<p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
									{formatDate(v.created_at)}
								</p>
								<div className="flex items-center gap-2 mt-3 flex-wrap">
									<button
										type="button"
										onClick={() => downloadFromUrl(v.svg_url, v.original_name)}
										className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
									>
										<Download className="w-3 h-3" />
										Descarregar
									</button>
									<button
										type="button"
										onClick={() => openEdit(v)}
										className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
									>
										<Edit3 className="w-3 h-3" />
										Editar
									</button>
									<button
										type="button"
										onClick={() => setDeleteConfirm(v.id)}
										className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium transition-colors"
									>
										<Trash2 className="w-3 h-3" />
										Excluir
									</button>
								</div>
							</div>
						))}
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between pt-4">
							<p className="text-slate-500 dark:text-slate-400 text-sm">
								{total} vetor{total !== 1 ? 'es' : ''}
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => onPageChange(page - 1)}
									disabled={!hasPrev}
									className="p-2 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
								>
									<ChevronLeft className="w-4 h-4" />
								</button>
								<span className="text-sm text-slate-600 dark:text-slate-400">
									Página {page} de {totalPages}
								</span>
								<button
									type="button"
									onClick={() => onPageChange(page + 1)}
									disabled={!hasNext}
									className="p-2 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
								>
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>
						</div>
					)}
				</>
			)}

			{/* Edit Modal */}
			{editModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
					<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-white/10 p-6 w-full max-w-md shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Editar vetor
							</h3>
							<button
								type="button"
								onClick={() => setEditModal(null)}
								className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="edit-vector-name"
									className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
								>
									Nome
								</label>
								<input
									id="edit-vector-name"
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
								/>
							</div>
							<div>
								<label
									htmlFor="edit-vector-replace-svg"
									className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
								>
									Substituir SVG (opcional)
								</label>
								<input
									id="edit-vector-replace-svg"
									type="file"
									accept={ACCEPTED_TYPES.join(',')}
									onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
									className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:text-sm file:font-medium file:cursor-pointer hover:file:bg-violet-500"
								/>
								{replaceFile && (
									<p className="mt-1 text-xs text-slate-500">
										{replaceFile.name} será vetorizado ao guardar
									</p>
								)}
							</div>
						</div>
						<div className="flex gap-2 mt-6">
							<button
								type="button"
								onClick={() => setEditModal(null)}
								className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSaveEdit}
								disabled={isSavingEdit || updateMutation.isPending}
								className="flex-1 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{(isSavingEdit || updateMutation.isPending) && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Guardar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete confirmation */}
			{deleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
					<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-white/10 p-6 w-full max-w-sm shadow-xl">
						<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
							Excluir vetor?
						</h3>
						<p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
							Esta ação não pode ser desfeita.
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setDeleteConfirm(null)}
								className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => handleDelete(deleteConfirm)}
								disabled={deleteMutation.isPending}
								className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{deleteMutation.isPending && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Excluir
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
