'use client';

import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateForumCategory,
	useDeleteForumCategory,
	useForumCategories,
	useUpdateForumCategory,
} from '@/hooks/use-forum';
import type { ForumCategory } from '@/types/forum';

const PRESET_COLORS = [
	'#7c3aed',
	'#2563eb',
	'#059669',
	'#d97706',
	'#dc2626',
	'#db2777',
	'#0891b2',
	'#65a30d',
];

interface CategoryFormProps {
	initial?: Partial<ForumCategory>;
	onSubmit: (data: { name: string; color: string }) => void;
	onCancel: () => void;
	isPending: boolean;
}

function CategoryForm({
	initial,
	onSubmit,
	onCancel,
	isPending,
}: CategoryFormProps) {
	const [name, setName] = useState(initial?.name ?? '');
	const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) {
			toast.error('Digite o nome da categoria');
			return;
		}
		onSubmit({ name: name.trim(), color });
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<div>
				<label
					htmlFor="category-name"
					className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
				>
					Nome
				</label>
				<input
					id="category-name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Ex: Máquinas"
					className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
				/>
			</div>
			<div>
				<label
					htmlFor="category-color"
					className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
				>
					Cor
				</label>
				<div className="flex gap-2 flex-wrap">
					{PRESET_COLORS.map((c) => (
						<button
							key={c}
							type="button"
							onClick={() => setColor(c)}
							className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a2e] scale-110' : 'hover:scale-105'}`}
							style={{ backgroundColor: c, ['--tw-ring-color' as string]: c }}
						/>
					))}
					<input
						id="category-color"
						type="color"
						value={color}
						onChange={(e) => setColor(e.target.value)}
						className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent"
						title="Cor personalizada"
					/>
				</div>
			</div>
			<div className="flex gap-2 pt-1">
				<button
					type="button"
					onClick={onCancel}
					className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
				>
					<X className="w-3.5 h-3.5" />
					Cancelar
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-lg transition-colors"
				>
					{isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
					Salvar
				</button>
			</div>
		</form>
	);
}

export function ForumCategoriesSection() {
	const { data: categories = [], isLoading } = useForumCategories();
	const create = useCreateForumCategory();
	const update = useUpdateForumCategory();
	const remove = useDeleteForumCategory();

	const [showCreate, setShowCreate] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	function handleCreate(data: { name: string; color: string }) {
		create.mutate(data, {
			onSuccess: () => {
				toast.success('Categoria criada!');
				setShowCreate(false);
			},
			onError: () => toast.error('Erro ao criar categoria'),
		});
	}

	function handleUpdate(id: string, data: { name: string; color: string }) {
		update.mutate(
			{ id, ...data },
			{
				onSuccess: () => {
					toast.success('Categoria atualizada!');
					setEditingId(null);
				},
				onError: () => toast.error('Erro ao atualizar categoria'),
			},
		);
	}

	function handleDelete(id: string) {
		if (!confirm('Deletar esta categoria? Os posts não serão afetados.'))
			return;
		remove.mutate(id, {
			onSuccess: () => toast.success('Categoria removida'),
			onError: () => toast.error('Erro ao remover categoria'),
		});
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-base font-bold text-slate-900 dark:text-white">
						Categorias do Fórum
					</h2>
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
						Organize as perguntas do fórum por categorias
					</p>
				</div>
				{!showCreate && (
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors"
					>
						<Plus className="w-3.5 h-3.5" />
						Nova categoria
					</button>
				)}
			</div>

			{/* Create form */}
			{showCreate && (
				<div className="bg-white dark:bg-white/5 border border-violet-200 dark:border-violet-500/30 rounded-2xl p-4">
					<h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
						Nova categoria
					</h3>
					<CategoryForm
						onSubmit={handleCreate}
						onCancel={() => setShowCreate(false)}
						isPending={create.isPending}
					/>
				</div>
			)}

			{/* List */}
			{isLoading ? (
				<div className="flex items-center justify-center py-10">
					<Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
				</div>
			) : categories.length === 0 ? (
				<div className="text-center py-10 text-slate-400 dark:text-slate-600 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
					<p className="text-sm">Nenhuma categoria criada</p>
				</div>
			) : (
				<div className="space-y-2">
					{categories.map((cat) => (
						<div
							key={cat.id}
							className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4"
						>
							{editingId === cat.id ? (
								<CategoryForm
									initial={cat}
									onSubmit={(data) => handleUpdate(cat.id, data)}
									onCancel={() => setEditingId(null)}
									isPending={update.isPending}
								/>
							) : (
								<div className="flex items-center gap-3">
									<div
										className="w-4 h-4 rounded-full shrink-0"
										style={{ backgroundColor: cat.color }}
									/>
									<div className="flex-1 min-w-0">
										<span className="text-sm font-semibold text-slate-900 dark:text-white">
											{cat.name}
										</span>
										{cat.postsCount > 0 && (
											<span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
												{cat.postsCount} posts
											</span>
										)}
									</div>
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => setEditingId(cat.id)}
											className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
											title="Editar"
										>
											<Pencil className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={() => handleDelete(cat.id)}
											disabled={remove.isPending}
											className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
											title="Deletar"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
