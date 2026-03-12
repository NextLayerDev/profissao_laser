'use client';

import {
	ChevronDown,
	ChevronRight,
	Edit,
	Loader2,
	MoveDown,
	MoveUp,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateDoubtCategory,
	useDeleteDoubtCategory,
	useDoubtCategoriesAdmin,
	useReorderDoubtCategories,
	useUpdateDoubtCategory,
} from '@/hooks/use-doubt-chat-admin';
import type { DoubtCategory } from '@/types/doubt-chat';
import { DoubtsByCategory } from './doubts-by-category';

function CategoryModal({
	editing,
	nextOrder,
	onClose,
	onSave,
}: {
	editing: DoubtCategory | null;
	nextOrder: number;
	onClose: () => void;
	onSave: (data: {
		title: string;
		description: string;
		order: number;
	}) => Promise<void>;
}) {
	const [title, setTitle] = useState(editing?.title ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		if (!title.trim()) {
			toast.error('Título é obrigatório');
			return;
		}
		setSaving(true);
		try {
			await onSave({
				title: title.trim(),
				description: description.trim(),
				order: nextOrder,
			});
			onClose();
		} catch {
			toast.error('Erro ao salvar');
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar categoria' : 'Nova categoria'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>
				<div className="p-5 space-y-4">
					<div>
						<label
							htmlFor="cat-title"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Título
						</label>
						<input
							id="cat-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ex: Configuração de equipamento"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="cat-desc"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Descrição (opcional)
						</label>
						<textarea
							id="cat-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Descrição da categoria..."
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none resize-none"
						/>
					</div>
				</div>
				<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={() => void handleSave()}
						disabled={saving}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}

export function CategoriesSection() {
	const { data: categories = [], isLoading } = useDoubtCategoriesAdmin();
	const createMutation = useCreateDoubtCategory();
	const updateMutation = useUpdateDoubtCategory();
	const deleteMutation = useDeleteDoubtCategory();
	const reorderMutation = useReorderDoubtCategories();

	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [modal, setModal] = useState<{
		open: boolean;
		editing: DoubtCategory | null;
	}>({ open: false, editing: null });

	function toggleExpanded(id: string) {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	async function handleSave(data: {
		title: string;
		description: string;
		order: number;
	}) {
		try {
			if (modal.editing) {
				await updateMutation.mutateAsync({
					id: modal.editing.id,
					payload: data,
				});
				toast.success('Categoria atualizada!');
			} else {
				await createMutation.mutateAsync(data);
				toast.success('Categoria criada!');
			}
			setModal({ open: false, editing: null });
		} catch {
			throw new Error('Erro ao salvar');
		}
	}

	async function handleDelete(cat: DoubtCategory) {
		if (!confirm(`Excluir a categoria "${cat.title}"?`)) return;
		try {
			await deleteMutation.mutateAsync(cat.id);
			toast.success('Categoria excluída!');
		} catch {
			toast.error('Erro ao excluir');
		}
	}

	async function moveCategory(idx: number, dir: -1 | 1) {
		const newIdx = idx + dir;
		if (newIdx < 0 || newIdx >= categories.length) return;
		const reordered = [...categories];
		[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
		try {
			await reorderMutation.mutateAsync(reordered.map((c) => c.id));
			toast.success('Ordem atualizada');
		} catch {
			toast.error('Erro ao reordenar');
		}
	}

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Categorias de Dúvidas
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
						{categories.length} categoria{categories.length !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus className="w-4 h-4" />
					Nova categoria
				</button>
			</div>

			{categories.length === 0 ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhuma categoria cadastrada
					</p>
					<button
						type="button"
						onClick={() => setModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium"
					>
						Criar primeira categoria
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{categories.map((cat, idx) => {
						const isExpanded = expandedIds.has(cat.id);
						return (
							<div
								key={cat.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
							>
								<div className="flex items-center gap-2 px-3 py-3">
									<div className="flex flex-col gap-0.5 shrink-0">
										<button
											type="button"
											onClick={() => void moveCategory(idx, -1)}
											disabled={idx === 0 || reorderMutation.isPending}
											className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
										>
											<MoveUp className="w-3 h-3 text-slate-500 dark:text-gray-400" />
										</button>
										<button
											type="button"
											onClick={() => void moveCategory(idx, 1)}
											disabled={
												idx === categories.length - 1 ||
												reorderMutation.isPending
											}
											className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
										>
											<MoveDown className="w-3 h-3 text-slate-500 dark:text-gray-400" />
										</button>
									</div>
									<button
										type="button"
										onClick={() => toggleExpanded(cat.id)}
										className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
									>
										{isExpanded ? (
											<ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										)}
									</button>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-slate-900 dark:text-white truncate">
											{cat.title}
										</p>
										{cat.description && (
											<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
												{cat.description}
											</p>
										)}
									</div>
									<button
										type="button"
										onClick={() => setModal({ open: true, editing: cat })}
										className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
										aria-label="Editar"
									>
										<Edit className="w-4 h-4 text-slate-500 dark:text-gray-400" />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(cat)}
										className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
										aria-label="Excluir"
									>
										<Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
									</button>
								</div>
								{isExpanded && (
									<div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-gray-700">
										<DoubtsByCategory
											categoryId={cat.id}
											categoryName={cat.title}
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{modal.open && (
				<CategoryModal
					editing={modal.editing}
					nextOrder={categories.length}
					onClose={() => setModal({ open: false, editing: null })}
					onSave={handleSave}
				/>
			)}
		</div>
	);
}
