'use client';

import { ChevronLeft, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateMachine,
	useCreateMachineOption,
	useDeleteMachine,
	useDeleteMachineOption,
	useMachine,
	useMachines,
	useUpdateMachine,
	useUpdateMachineOption,
} from '@/hooks/use-machines';
import type {
	CreateMachinePayload,
	Machine,
	MachineOption,
	MachineOptionCategory,
	MachineOptions,
} from '@/types/machines';

const inputCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

const selectCls =
	'px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';

const CATEGORY_LABELS: Record<MachineOptionCategory, string> = {
	power: 'Potencia',
	lens: 'Lente',
	software: 'Software',
	axis: 'Eixo',
	operation: 'Operacao',
};

const CATEGORIES: MachineOptionCategory[] = [
	'power',
	'lens',
	'software',
	'axis',
	'operation',
];

function countOptions(options: MachineOptions): number {
	return CATEGORIES.reduce((sum, cat) => sum + options[cat].length, 0);
}

/* ------------------------------------------------------------------ */
/*  Machine Modal                                                       */
/* ------------------------------------------------------------------ */

function MachineModal({
	editing,
	onClose,
	onSave,
	saving,
}: {
	editing: Machine | null;
	onClose: () => void;
	onSave: (data: CreateMachinePayload) => void;
	saving: boolean;
}) {
	const [name, setName] = useState(editing?.name ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [order, setOrder] = useState(editing?.order ?? 0);
	const [status, setStatus] = useState<'ativo' | 'inativo'>(
		editing?.status ?? 'ativo',
	);

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar Maquina' : 'Nova Maquina'}
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
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Nome *
						</span>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Fiber, UV, CO2, Diodo"
							className={inputCls}
						/>
					</div>
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Descricao
						</span>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Descricao da maquina..."
							className={`${inputCls} resize-none`}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Ordem
							</span>
							<input
								type="number"
								value={order}
								onChange={(e) => setOrder(Number(e.target.value))}
								min={0}
								className={inputCls}
							/>
						</div>
						<div>
							<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Status
							</span>
							<select
								value={status}
								onChange={(e) =>
									setStatus(e.target.value as 'ativo' | 'inativo')
								}
								className={selectCls}
							>
								<option value="ativo">Ativo</option>
								<option value="inativo">Inativo</option>
							</select>
						</div>
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
						disabled={saving || !name.trim()}
						onClick={() =>
							onSave({
								name: name.trim(),
								description: description.trim() || undefined,
								order,
								status,
							})
						}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{saving && <Loader2 className="w-4 h-4 animate-spin" />}
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Option Modal                                                        */
/* ------------------------------------------------------------------ */

function OptionModal({
	editing,
	category,
	onClose,
	onSave,
	saving,
}: {
	editing: MachineOption | null;
	category: MachineOptionCategory;
	onClose: () => void;
	onSave: (data: { value: string; order: number; status: string }) => void;
	saving: boolean;
}) {
	const [value, setValue] = useState(editing?.value ?? '');
	const [order, setOrder] = useState(editing?.order ?? 0);
	const [status, setStatus] = useState<'ativo' | 'inativo'>(
		editing?.status ?? 'ativo',
	);

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-sm">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar' : 'Nova'} {CATEGORY_LABELS[category]}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500" />
					</button>
				</div>
				<div className="p-5 space-y-4">
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Valor *
						</span>
						<input
							type="text"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder={`Ex: ${category === 'power' ? '20W, 30W, 50W' : category === 'lens' ? '110mm, 160mm' : 'valor'}`}
							className={inputCls}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Ordem
							</span>
							<input
								type="number"
								value={order}
								onChange={(e) => setOrder(Number(e.target.value))}
								min={0}
								className={inputCls}
							/>
						</div>
						<div>
							<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Status
							</span>
							<select
								value={status}
								onChange={(e) =>
									setStatus(e.target.value as 'ativo' | 'inativo')
								}
								className={selectCls}
							>
								<option value="ativo">Ativo</option>
								<option value="inativo">Inativo</option>
							</select>
						</div>
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
						disabled={saving || !value.trim()}
						onClick={() =>
							onSave({
								value: value.trim(),
								order,
								status,
							})
						}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{saving && <Loader2 className="w-4 h-4 animate-spin" />}
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Machine Detail (Options Manager)                                    */
/* ------------------------------------------------------------------ */

function MachineDetail({
	machineId,
	onBack,
}: {
	machineId: string;
	onBack: () => void;
}) {
	const { data: machine, isLoading } = useMachine(machineId);
	const createOption = useCreateMachineOption();
	const updateOption = useUpdateMachineOption();
	const deleteOption = useDeleteMachineOption();

	const [optionModal, setOptionModal] = useState<{
		open: boolean;
		category: MachineOptionCategory;
		editing: MachineOption | null;
	} | null>(null);

	async function handleSaveOption(data: {
		value: string;
		order: number;
		status: string;
	}) {
		if (!optionModal) return;
		try {
			if (optionModal.editing) {
				await updateOption.mutateAsync({
					machineId,
					optionId: optionModal.editing.id,
					payload: data,
				});
			} else {
				await createOption.mutateAsync({
					machineId,
					payload: {
						category: optionModal.category,
						...data,
					},
				});
			}
			setOptionModal(null);
		} catch {
			// toast handled by mutation
		}
	}

	async function handleDeleteOption(optionId: string) {
		if (!confirm('Excluir esta opcao?')) return;
		try {
			await deleteOption.mutateAsync({ machineId, optionId });
		} catch {
			// toast handled by mutation
		}
	}

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!machine) return null;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onBack}
					className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
				>
					<ChevronLeft className="w-5 h-5 text-slate-500" />
				</button>
				<div className="flex-1">
					<h3 className="text-xl font-bold text-slate-900 dark:text-white">
						{machine.name}
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						{machine.description || 'Sem descricao'} ·{' '}
						{countOptions(machine.options)} opcoes
					</p>
				</div>
			</div>

			{CATEGORIES.map((cat) => {
				const options = machine.options[cat];
				return (
					<div
						key={cat}
						className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-5"
					>
						<div className="flex items-center justify-between mb-3">
							<h4 className="font-semibold text-slate-900 dark:text-white">
								{CATEGORY_LABELS[cat]}
							</h4>
							<button
								type="button"
								onClick={() =>
									setOptionModal({
										open: true,
										category: cat,
										editing: null,
									})
								}
								className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
							>
								<Plus className="w-3 h-3" />
								Adicionar
							</button>
						</div>
						{options.length === 0 ? (
							<p className="text-sm text-slate-400 dark:text-gray-500">
								Nenhuma opcao cadastrada
							</p>
						) : (
							<div className="flex flex-wrap gap-2">
								{options.map((opt) => (
									<div
										key={opt.id}
										className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
											opt.status === 'ativo'
												? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white'
												: 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-500'
										}`}
									>
										<span>{opt.value}</span>
										<button
											type="button"
											onClick={() =>
												setOptionModal({
													open: true,
													category: cat,
													editing: opt,
												})
											}
											className="p-0.5 hover:text-violet-600 transition-colors"
										>
											<Pencil className="w-3 h-3" />
										</button>
										<button
											type="button"
											onClick={() => void handleDeleteOption(opt.id)}
											className="p-0.5 hover:text-red-500 transition-colors"
										>
											<Trash2 className="w-3 h-3" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				);
			})}

			{optionModal && (
				<OptionModal
					editing={optionModal.editing}
					category={optionModal.category}
					onClose={() => setOptionModal(null)}
					onSave={(data) => void handleSaveOption(data)}
					saving={createOption.isPending || updateOption.isPending}
				/>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Main View                                                           */
/* ------------------------------------------------------------------ */

export function MachinesAdminView() {
	const { data: machines, isLoading } = useMachines();
	const createMut = useCreateMachine();
	const updateMut = useUpdateMachine();
	const deleteMut = useDeleteMachine();

	const [machineModal, setMachineModal] = useState<{
		open: boolean;
		editing: Machine | null;
	}>({ open: false, editing: null });
	const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
		null,
	);

	async function handleSaveMachine(payload: CreateMachinePayload) {
		try {
			if (machineModal.editing) {
				await updateMut.mutateAsync({
					id: machineModal.editing.id,
					payload,
				});
			} else {
				await createMut.mutateAsync(payload);
			}
			setMachineModal({ open: false, editing: null });
		} catch {
			// toast handled by mutation
		}
	}

	async function handleDeleteMachine(machine: Machine) {
		if (!confirm(`Excluir "${machine.name}" e todas as opcoes associadas?`))
			return;
		try {
			await deleteMut.mutateAsync(machine.id);
		} catch {
			toast.error('Erro ao excluir maquina');
		}
	}

	if (selectedMachineId) {
		return (
			<MachineDetail
				machineId={selectedMachineId}
				onBack={() => setSelectedMachineId(null)}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Catalogo de Maquinas
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
						{machines?.length ?? 0} maquina
						{(machines?.length ?? 0) !== 1 ? 's' : ''} cadastrada
						{(machines?.length ?? 0) !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setMachineModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus className="w-4 h-4" />
					Nova Maquina
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
				</div>
			) : !machines?.length ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhuma maquina cadastrada
					</p>
					<button
						type="button"
						onClick={() => setMachineModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium"
					>
						Criar primeira maquina
					</button>
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 dark:bg-white/5">
							<tr>
								<th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Nome
								</th>
								<th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Descricao
								</th>
								<th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Opcoes
								</th>
								<th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Ordem
								</th>
								<th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Status
								</th>
								<th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Acoes
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-gray-800">
							{machines.map((m) => (
								<tr
									key={m.id}
									className="bg-white dark:bg-[#1a1a1d] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
								>
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => setSelectedMachineId(m.id)}
											className="text-left hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-semibold text-slate-900 dark:text-white"
										>
											{m.name}
										</button>
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400 max-w-[200px] truncate">
										{m.description ?? '—'}
									</td>
									<td className="px-4 py-3 text-center text-slate-600 dark:text-gray-400">
										{countOptions(m.options)}
									</td>
									<td className="px-4 py-3 text-center text-slate-600 dark:text-gray-400">
										{m.order}
									</td>
									<td className="px-4 py-3 text-center">
										<span
											className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
												m.status === 'ativo'
													? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
													: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400'
											}`}
										>
											{m.status}
										</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() => setSelectedMachineId(m.id)}
												className="p-1.5 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
												title="Gerenciar opcoes"
											>
												<Plus className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() =>
													setMachineModal({
														open: true,
														editing: m,
													})
												}
												className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
												title="Editar"
											>
												<Pencil className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() => void handleDeleteMachine(m)}
												className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
												title="Excluir"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{machineModal.open && (
				<MachineModal
					editing={machineModal.editing}
					onClose={() => setMachineModal({ open: false, editing: null })}
					onSave={(data) => void handleSaveMachine(data)}
					saving={createMut.isPending || updateMut.isPending}
				/>
			)}
		</div>
	);
}
