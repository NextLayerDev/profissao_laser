'use client';

import {
	Check,
	Loader2,
	Pencil,
	Plus,
	Tags,
	ToggleLeft,
	ToggleRight,
	Trash2,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	useCreateParameterOption,
	useDeleteParameterOption,
	useParameterOptions,
	useUpdateParameterOption,
} from '@/hooks/use-parameters';
import type { ParameterOption } from '@/types/parameters';

type Dimension =
	| 'machine'
	| 'lens'
	| 'category'
	| 'material'
	| 'color'
	| 'mode';

const DIMENSIONS: { value: Dimension; label: string }[] = [
	{ value: 'machine', label: 'Máquina' },
	{ value: 'lens', label: 'Lente' },
	{ value: 'category', label: 'Categoria' },
	{ value: 'material', label: 'Material' },
	{ value: 'color', label: 'Cor' },
	{ value: 'mode', label: 'Tipo' },
];

const DIMENSION_LABEL: Record<Dimension, string> = {
	machine: 'Máquina',
	lens: 'Lente',
	category: 'Categoria',
	material: 'Material',
	color: 'Cor',
	mode: 'Tipo',
};

export function VocabAdminSection() {
	const [dimension, setDimension] = useState<Dimension>('machine');
	const [deleteTarget, setDeleteTarget] = useState<ParameterOption | null>(
		null,
	);

	const { data: options = [], isLoading } = useParameterOptions(dimension);
	const deleteMut = useDeleteParameterOption();

	const handleDelete = (opt: ParameterOption) => {
		deleteMut.mutate(opt.id, {
			onSuccess: () => setDeleteTarget(null),
		});
	};

	const sorted = [...options].sort((a, b) => a.order - b.order);

	return (
		<div className="space-y-4">
			<div>
				<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
					Vocabulários
				</h2>
				<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
					Opções por trás dos filtros Máquina / Lente / Categoria / Material /
					Cor / Tipo. Aparecem nos dropdowns e no form de parâmetro.
				</p>
			</div>

			{/* Dimension selector (segmented) */}
			<div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-1">
				{DIMENSIONS.map((d) => (
					<button
						key={d.value}
						type="button"
						onClick={() => setDimension(d.value)}
						className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
							dimension === d.value
								? 'bg-violet-600 text-white'
								: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
						}`}
					>
						{d.label}
					</button>
				))}
			</div>

			{/* Add row */}
			<AddOptionRow dimension={dimension} nextOrder={sorted.length} />

			{/* List */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
				</div>
			) : sorted.length === 0 ? (
				<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-12 text-center">
					<Tags className="w-10 h-10 text-slate-400 mx-auto mb-3" />
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nenhuma opção de {DIMENSION_LABEL[dimension]} cadastrada.
					</p>
				</div>
			) : (
				<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
					{sorted.map((opt) => (
						<OptionRow
							key={opt.id}
							option={opt}
							onDelete={() => setDeleteTarget(opt)}
						/>
					))}
				</div>
			)}

			{deleteTarget && (
				<ModalOverlay onClose={() => setDeleteTarget(null)}>
					<div className="p-6">
						<h3 className="text-lg font-bold text-slate-900 dark:text-white">
							Remover opção?
						</h3>
						<p className="text-sm text-slate-600 dark:text-gray-400 mt-2">
							"{deleteTarget.value}" ({DIMENSION_LABEL[dimension]}) será
							removida. Parâmetros que já usam esse valor não são afetados.
						</p>
						<div className="mt-6 flex gap-3 justify-end">
							<button
								type="button"
								onClick={() => setDeleteTarget(null)}
								className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => handleDelete(deleteTarget)}
								disabled={deleteMut.isPending}
								className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
							>
								{deleteMut.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									'Remover'
								)}
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}
		</div>
	);
}

// ─── Add row ─────────────────────────────────────────────────────────────

function AddOptionRow({
	dimension,
	nextOrder,
}: {
	dimension: Dimension;
	nextOrder: number;
}) {
	const create = useCreateParameterOption();
	const [value, setValue] = useState('');
	const [order, setOrder] = useState<number>(nextOrder);

	const handleAdd = () => {
		const trimmed = value.trim();
		if (!trimmed) {
			toast.error('Preencha o valor.');
			return;
		}
		create.mutate(
			{ dimension, value: trimmed, order },
			{
				onSuccess: () => {
					setValue('');
					setOrder((o) => o + 1);
				},
			},
		);
	};

	return (
		<div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3">
			<div className="flex-1 min-w-[12rem]">
				<label
					htmlFor="vocab-value"
					className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1"
				>
					Novo valor
				</label>
				<input
					id="vocab-value"
					type="text"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
					placeholder="ex: 110x110"
					className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 px-3 focus:outline-none focus:border-violet-500"
				/>
			</div>
			<div>
				<label
					htmlFor="vocab-order"
					className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1"
				>
					Ordem
				</label>
				<input
					id="vocab-order"
					type="number"
					min={0}
					value={order}
					onChange={(e) => setOrder(Number(e.target.value))}
					className="w-24 h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
				/>
			</div>
			<button
				type="button"
				onClick={handleAdd}
				disabled={!value.trim() || create.isPending}
				className="inline-flex items-center gap-2 h-10 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
			>
				{create.isPending ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<Plus className="w-4 h-4" />
				)}
				Adicionar
			</button>
		</div>
	);
}

// ─── Option row (view + inline edit) ─────────────────────────────────────

function OptionRow({
	option,
	onDelete,
}: {
	option: ParameterOption;
	onDelete: () => void;
}) {
	const update = useUpdateParameterOption();
	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState(option.value);
	const [order, setOrder] = useState(option.order);

	const isActive = option.status === 'ativo';

	const handleSave = () => {
		const trimmed = value.trim();
		if (!trimmed) {
			toast.error('Preencha o valor.');
			return;
		}
		update.mutate(
			{ id: option.id, body: { value: trimmed, order } },
			{ onSuccess: () => setEditing(false) },
		);
	};

	const handleCancel = () => {
		setValue(option.value);
		setOrder(option.order);
		setEditing(false);
	};

	const toggleStatus = () => {
		update.mutate({
			id: option.id,
			body: { status: isActive ? 'inativo' : 'ativo' },
		});
	};

	if (editing) {
		return (
			<div className="flex flex-wrap items-end gap-3 p-3 bg-violet-50/50 dark:bg-violet-500/5">
				<div className="flex-1 min-w-[12rem]">
					<label
						htmlFor={`edit-value-${option.id}`}
						className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1"
					>
						Valor
					</label>
					<input
						id={`edit-value-${option.id}`}
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && handleSave()}
						className="w-full h-10 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
					/>
				</div>
				<div>
					<label
						htmlFor={`edit-order-${option.id}`}
						className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1"
					>
						Ordem
					</label>
					<input
						id={`edit-order-${option.id}`}
						type="number"
						min={0}
						value={order}
						onChange={(e) => setOrder(Number(e.target.value))}
						className="w-24 h-10 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
					/>
				</div>
				<button
					type="button"
					onClick={handleSave}
					disabled={!value.trim() || update.isPending}
					className="inline-flex items-center gap-1.5 h-10 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
				>
					{update.isPending ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Check className="w-4 h-4" />
					)}
					Salvar
				</button>
				<button
					type="button"
					onClick={handleCancel}
					className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
				>
					<X className="w-4 h-4" />
					Cancelar
				</button>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between gap-3 p-3">
			<div className="flex items-center gap-3 min-w-0">
				<span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-white/10 px-1.5 text-xs font-semibold text-slate-500 dark:text-gray-400">
					{option.order}
				</span>
				<span
					className={`text-sm font-medium truncate ${
						isActive
							? 'text-slate-900 dark:text-white'
							: 'text-slate-400 dark:text-gray-500 line-through'
					}`}
				>
					{option.value}
				</span>
				<span
					className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
						isActive
							? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
							: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400'
					}`}
				>
					{isActive ? 'ativo' : 'inativo'}
				</span>
			</div>
			<div className="flex items-center gap-1 shrink-0">
				<button
					type="button"
					onClick={toggleStatus}
					disabled={update.isPending}
					className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors disabled:opacity-50"
					aria-label={isActive ? 'Desativar' : 'Ativar'}
					title={isActive ? 'Desativar' : 'Ativar'}
				>
					{isActive ? (
						<ToggleRight className="w-5 h-5 text-emerald-500" />
					) : (
						<ToggleLeft className="w-5 h-5" />
					)}
				</button>
				<button
					type="button"
					onClick={() => setEditing(true)}
					className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
					aria-label="Editar"
					title="Editar"
				>
					<Pencil className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={onDelete}
					className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
					aria-label="Remover"
					title="Remover"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}
