'use client';

import {
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Download,
	Loader2,
	Pencil,
	Search,
	Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useDeleteCustomerVector, useUpdateVector } from '@/hooks/use-vectors';
import { useToolBilling } from '@/modules/tools/hooks/use-tool-billing';
import { chargeVectorFormat } from '@/services/vectorize';
import type { CustomerVector } from '@/services/vectors';
import { formatDate } from '@/utils/formatDate';

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
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	const updateMutation = useUpdateVector();
	const deleteMutation = useDeleteCustomerVector();

	// Cobrança POR FORMATO também no re-download da biblioteca: SVG já pago não
	// recobra; SVG nunca pago cobra (fecha o bypass "gera grátis → baixa aqui").
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const billing = useToolBilling('vectorize', courseSlug);
	const [chargingId, setChargingId] = useState<string | null>(null);

	const handleDownload = useCallback(
		async (v: CustomerVector) => {
			const doDownload = () => downloadFromUrl(v.svg_url, v.original_name);
			if (v.paid_formats?.includes('svg') || !billing.billed) {
				doDownload();
				return;
			}
			if (chargingId) return;
			setChargingId(v.id);
			try {
				const res = await billing.runEngine((invocationId) =>
					chargeVectorFormat(v.id, 'svg', invocationId),
				);
				if (res && Array.isArray(res.paidFormats)) {
					doDownload();
					onRefetch(); // atualiza paid_formats na lista
				}
			} finally {
				setChargingId(null);
			}
		},
		[billing, chargingId, onRefetch],
	);

	// Debounce search. Só dispara quando o texto REALMENTE mudou vs o já commitado
	// (`search`). Sem esse guard, um re-render do pai (ex.: trocar de página, que
	// recria o `onSearchChange` inline) re-rodava este efeito e chamava
	// onSearchChange(searchInput) → o pai resetava a página pra 1 → a paginação
	// "não avançava". Comparar com `search` evita o reset espúrio.
	useEffect(() => {
		if (searchInput === search) return;
		const t = setTimeout(() => onSearchChange(searchInput), 300);
		return () => clearTimeout(t);
	}, [searchInput, search, onSearchChange]);

	// Sync search input when parent search changes (e.g. after reset)
	useEffect(() => {
		setSearchInput(search);
	}, [search]);

	useEffect(() => setMounted(true), []);

	const startEdit = useCallback((v: CustomerVector) => {
		setEditingId(v.id);
		setEditName(v.original_name);
	}, []);

	const handleSaveEdit = useCallback(
		async (id: string) => {
			const name = editName.trim();
			if (!name) {
				setEditingId(null);
				return;
			}
			await updateMutation.mutateAsync({ id, payload: { originalName: name } });
			setEditingId(null);
			onRefetch();
		},
		[editName, updateMutation, onRefetch],
	);

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
							className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
						/>
					</div>
				</div>
			</div>

			{data.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-12 text-center">
					<BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400">
						{search
							? 'Nenhum vetor encontrado.'
							: 'Ainda não tem vetores guardados.'}
					</p>
					{search && (
						<button
							type="button"
							onClick={() => setSearchInput('')}
							className="mt-2 text-violet-600 hover:text-violet-400 text-sm"
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
								className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4 overflow-hidden"
							>
								{/* fundo claro também no dark pra os vetores pretos aparecerem */}
								<div className="aspect-square relative bg-slate-100 dark:bg-slate-200 rounded-lg mb-3">
									<Image
										src={v.svg_url}
										alt={v.original_name}
										fill
										className="object-contain p-2"
										unoptimized
									/>
								</div>

								{editingId === v.id ? (
									<div className="space-y-2">
										<input
											type="text"
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') handleSaveEdit(v.id);
												if (e.key === 'Escape') setEditingId(null);
											}}
											className="w-full px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
										/>
										<div className="flex gap-1">
											<button
												type="button"
												onClick={() => handleSaveEdit(v.id)}
												disabled={updateMutation.isPending}
												className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-lg disabled:opacity-50"
											>
												{updateMutation.isPending && (
													<Loader2 className="w-3 h-3 animate-spin" />
												)}
												Salvar
											</button>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												className="flex-1 text-xs py-1.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
											>
												Cancelar
											</button>
										</div>
									</div>
								) : (
									<>
										<p className="font-medium text-slate-900 dark:text-white truncate text-sm">
											{v.original_name}
										</p>
										<p className="text-slate-500 dark:text-gray-400 text-xs mt-0.5">
											{formatDate(v.created_at)}
										</p>
										<div className="flex items-center gap-2 mt-3 flex-wrap">
											<button
												type="button"
												disabled={chargingId !== null}
												onClick={() => handleDownload(v)}
												className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
											>
												{chargingId === v.id ? (
													<Loader2 className="w-3 h-3 animate-spin" />
												) : (
													<Download className="w-3 h-3" />
												)}
												Descarregar
												{billing.billed &&
													billing.cost > 0 &&
													!v.paid_formats?.includes('svg') && (
														<span className="opacity-80">· {billing.cost}</span>
													)}
											</button>
											<button
												type="button"
												onClick={() => startEdit(v)}
												className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
											>
												<Pencil className="w-3 h-3" />
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
									</>
								)}
							</div>
						))}
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between pt-4">
							<p className="text-slate-500 dark:text-gray-400 text-sm">
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
								<span className="text-sm text-slate-600 dark:text-gray-400">
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

			{/* Delete confirmation (portal p/ centralizar no viewport, escapa transform de ancestral) */}
			{mounted &&
				deleteConfirm &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
						<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-white/10 p-6 w-full max-w-sm shadow-xl">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
								Excluir vetor?
							</h3>
							<p className="text-slate-600 dark:text-gray-400 text-sm mb-6">
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
					</div>,
					document.body,
				)}
		</div>
	);
}
