'use client';

import {
	ChevronDown,
	ChevronRight,
	Edit,
	Loader2,
	Plus,
	Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateVectorizeHelp,
	useDeleteVectorizeHelp,
	useUpdateVectorizeHelp,
	useVectorizeHelp,
} from '@/hooks/use-vectorize-help';
import type {
	CreateVectorizeHelpPayload,
	VectorizeHelpItem,
} from '@/types/vectorize-help';
import { HELP_ICON_MAP, VetorizacaoHelpModal } from './vetorizacao-help-modal';

type TypeFilter = 'all' | 'text' | 'video';

export function VetorizacaoHelpAdminView() {
	const { data: items = [], isLoading } = useVectorizeHelp();
	const createMutation = useCreateVectorizeHelp();
	const updateMutation = useUpdateVectorizeHelp();
	const deleteMutation = useDeleteVectorizeHelp();

	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
	const [modal, setModal] = useState<{
		open: boolean;
		editing: VectorizeHelpItem | null;
	}>({ open: false, editing: null });

	const filtered = useMemo(() => {
		const sorted = [...items].sort((a, b) => a.order - b.order);
		if (typeFilter === 'all') return sorted;
		return sorted.filter((i) => i.type === typeFilter);
	}, [items, typeFilter]);

	function toggleExpanded(id: string) {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	async function handleSave(data: CreateVectorizeHelpPayload) {
		try {
			if (modal.editing) {
				await updateMutation.mutateAsync({
					id: modal.editing.id,
					payload: data,
				});
				toast.success('Item atualizado!');
			} else {
				await createMutation.mutateAsync(data);
				toast.success('Item criado!');
			}
			setModal({ open: false, editing: null });
		} catch {
			toast.error('Erro ao salvar');
		}
	}

	async function handleDelete(item: VectorizeHelpItem) {
		if (!confirm(`Excluir "${item.title}"?`)) return;
		try {
			await deleteMutation.mutateAsync(item.id);
			toast.success('Item excluido!');
		} catch {
			toast.error('Erro ao excluir');
		}
	}

	const textCount = items.filter((i) => i.type === 'text').length;
	const videoCount = items.filter((i) => i.type === 'video').length;

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Itens de Ajuda
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
						{textCount} texto{textCount !== 1 ? 's' : ''} · {videoCount} video
						{videoCount !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo
				</button>
			</div>

			{/* Filter tabs */}
			<div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit">
				{(
					[
						{ key: 'all', label: `Todos (${items.length})` },
						{ key: 'text', label: `Texto (${textCount})` },
						{ key: 'video', label: `Videos (${videoCount})` },
					] as const
				).map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setTypeFilter(tab.key)}
						className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
							typeFilter === tab.key
								? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Lista */}
			{filtered.length === 0 ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhum item de ajuda cadastrado
					</p>
					<button
						type="button"
						onClick={() => setModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium"
					>
						Criar primeiro item
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((item) => {
						const isExpanded = expandedIds.has(item.id);
						const Icon = HELP_ICON_MAP[item.icon] || HELP_ICON_MAP.play;
						return (
							<div
								key={item.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
							>
								<div className="flex items-center gap-2 px-3 py-3">
									{/* Expand */}
									<button
										type="button"
										onClick={() => toggleExpanded(item.id)}
										className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
									>
										{isExpanded ? (
											<ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										)}
									</button>

									{/* Icon */}
									<div
										className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
											item.type === 'video'
												? 'bg-rose-100 dark:bg-rose-500/20'
												: 'bg-violet-100 dark:bg-violet-500/20'
										}`}
									>
										<Icon
											className={`w-4 h-4 ${
												item.type === 'video'
													? 'text-rose-600 dark:text-rose-400'
													: 'text-violet-600 dark:text-violet-400'
											}`}
										/>
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-slate-900 dark:text-white truncate">
											{item.title}
										</p>
										<div className="flex items-center gap-2 mt-0.5">
											<span className="text-xs text-slate-500 dark:text-gray-400">
												{item.type === 'video' ? 'Video' : 'Texto'}
											</span>
											<span className="text-xs text-slate-400 dark:text-gray-500">
												· Ordem: {item.order}
											</span>
											{!item.active && (
												<span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
													Inativo
												</span>
											)}
										</div>
									</div>

									{/* Acoes */}
									<button
										type="button"
										onClick={() => setModal({ open: true, editing: item })}
										className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
										aria-label="Editar"
									>
										<Edit className="w-4 h-4 text-slate-500 dark:text-gray-400" />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(item)}
										className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
										aria-label="Excluir"
									>
										<Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
									</button>
								</div>

								{/* Expanded preview */}
								{isExpanded && (
									<div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-gray-700 space-y-3">
										<div className="pt-3">
											<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
												Descricao:
											</p>
											<p className="text-sm text-slate-600 dark:text-slate-400">
												{item.description}
											</p>
										</div>
										{item.content && (
											<div>
												<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
													Conteudo:
												</p>
												<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-6">
													{item.content}
												</p>
											</div>
										)}
										{item.videoUrl && (
											<div>
												<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
													URL do video:
												</p>
												<a
													href={item.videoUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-violet-600 dark:text-violet-400 underline break-all"
												>
													{item.videoUrl}
												</a>
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Modal */}
			{modal.open && (
				<VetorizacaoHelpModal
					editing={modal.editing}
					nextOrder={items.length}
					onClose={() => setModal({ open: false, editing: null })}
					onSave={handleSave}
				/>
			)}
		</div>
	);
}
