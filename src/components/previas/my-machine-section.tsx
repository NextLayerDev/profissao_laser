'use client';

import {
	ChevronDown,
	Loader2,
	Pencil,
	Play,
	Plus,
	Settings,
	Star,
	Trash2,
	X,
	Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateCustomerMachine,
	useCustomerMachines,
	useDeleteCustomerMachineEntry,
	useMachines,
	useUpdateCustomerMachine,
} from '@/hooks/use-machines';
import { useParameterLookup } from '@/hooks/use-product-parameters';
import type {
	CustomerMachineEntry,
	MachineOptionCategory,
} from '@/types/machines';
import type { ParameterLookupParams } from '@/types/product-parameters';

const selectCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';

const inputCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

const OPTION_LABELS: Record<MachineOptionCategory, string> = {
	power: 'Potencia',
	lens: 'Lente',
	software: 'Software',
	axis: 'Eixo',
	operation: 'Operacao',
};

const OPTION_CATEGORIES: MachineOptionCategory[] = [
	'power',
	'lens',
	'software',
	'axis',
	'operation',
];

/* ------------------------------------------------------------------ */
/*  Machine Form Modal                                                  */
/* ------------------------------------------------------------------ */

function MachineFormModal({
	editing,
	onClose,
	onSave,
	saving,
}: {
	editing: CustomerMachineEntry | null;
	onClose: () => void;
	onSave: (data: {
		name: string;
		machineId: string;
		powerOptionId: string;
		lensOptionId: string;
		softwareOptionId: string;
		axisOptionId: string;
		operationOptionId: string;
		isDefault: boolean;
	}) => void;
	saving: boolean;
}) {
	const { data: machines } = useMachines();

	const [name, setName] = useState(editing?.name ?? '');
	const [machineId, setMachineId] = useState(editing?.machineId ?? '');
	const [powerOptionId, setPowerOptionId] = useState(
		editing?.powerOptionId ?? '',
	);
	const [lensOptionId, setLensOptionId] = useState(editing?.lensOptionId ?? '');
	const [softwareOptionId, setSoftwareOptionId] = useState(
		editing?.softwareOptionId ?? '',
	);
	const [axisOptionId, setAxisOptionId] = useState(editing?.axisOptionId ?? '');
	const [operationOptionId, setOperationOptionId] = useState(
		editing?.operationOptionId ?? '',
	);
	const [isDefault, setIsDefault] = useState(editing?.isDefault ?? false);

	const selectedMachine = machines?.find((m) => m.id === machineId);

	const optionSetters: Record<MachineOptionCategory, (v: string) => void> = {
		power: setPowerOptionId,
		lens: setLensOptionId,
		software: setSoftwareOptionId,
		axis: setAxisOptionId,
		operation: setOperationOptionId,
	};

	const optionValues: Record<MachineOptionCategory, string> = {
		power: powerOptionId,
		lens: lensOptionId,
		software: softwareOptionId,
		axis: axisOptionId,
		operation: operationOptionId,
	};

	function handleMachineChange(newId: string) {
		setMachineId(newId);
		setPowerOptionId('');
		setLensOptionId('');
		setSoftwareOptionId('');
		setAxisOptionId('');
		setOperationOptionId('');
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar Maquina' : 'Adicionar Maquina'}
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
							Nome (apelido)
						</span>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Minha Fiber 30W"
							className={inputCls}
						/>
					</div>
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Tipo de Maquina *
						</span>
						<select
							value={machineId}
							onChange={(e) => handleMachineChange(e.target.value)}
							className={selectCls}
						>
							<option value="">Selecione sua maquina</option>
							{machines
								?.filter((m) => m.status === 'ativo')
								.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name}
									</option>
								))}
						</select>
					</div>

					{selectedMachine && (
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{OPTION_CATEGORIES.map((cat) => {
								const opts = selectedMachine.options[cat].filter(
									(o) => o.status === 'ativo',
								);
								if (opts.length === 0) return null;
								return (
									<div key={cat}>
										<span className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 block">
											{OPTION_LABELS[cat]}
										</span>
										<select
											value={optionValues[cat]}
											onChange={(e) => optionSetters[cat](e.target.value)}
											className={selectCls}
										>
											<option value="">Selecione</option>
											{opts.map((o) => (
												<option key={o.id} value={o.id}>
													{o.value}
												</option>
											))}
										</select>
									</div>
								);
							})}
						</div>
					)}

					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={isDefault}
							onChange={(e) => setIsDefault(e.target.checked)}
							className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
						/>
						<span className="text-sm text-slate-700 dark:text-slate-300">
							Maquina padrao
						</span>
					</label>
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
						disabled={saving || !machineId}
						onClick={() =>
							onSave({
								name: name.trim(),
								machineId,
								powerOptionId,
								lensOptionId,
								softwareOptionId,
								axisOptionId,
								operationOptionId,
								isDefault,
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
/*  Main Section                                                        */
/* ------------------------------------------------------------------ */

export function MyMachineSection({
	productId,
	variantId,
}: {
	productId: string | null;
	variantId?: string | null;
}) {
	const { data: machines } = useMachines();
	const { data: savedMachines, isLoading } = useCustomerMachines();
	const createMut = useCreateCustomerMachine();
	const updateMut = useUpdateCustomerMachine();
	const deleteMut = useDeleteCustomerMachineEntry();

	const [modal, setModal] = useState<{
		open: boolean;
		editing: CustomerMachineEntry | null;
	}>({ open: false, editing: null });

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [showLookup, setShowLookup] = useState(false);

	// Auto-select default machine
	useEffect(() => {
		if (savedMachines?.length && !selectedId) {
			const def = savedMachines.find((m) => m.isDefault);
			setSelectedId(def?.id ?? savedMachines[0].id);
		}
	}, [savedMachines, selectedId]);

	const selected = savedMachines?.find((m) => m.id === selectedId);
	const machineMap = new Map((machines ?? []).map((m) => [m.id, m]));

	async function handleSave(data: {
		name: string;
		machineId: string;
		powerOptionId: string;
		lensOptionId: string;
		softwareOptionId: string;
		axisOptionId: string;
		operationOptionId: string;
		isDefault: boolean;
	}) {
		try {
			const payload = {
				name: data.name || undefined,
				machineId: data.machineId,
				powerOptionId: data.powerOptionId || null,
				lensOptionId: data.lensOptionId || null,
				softwareOptionId: data.softwareOptionId || null,
				axisOptionId: data.axisOptionId || null,
				operationOptionId: data.operationOptionId || null,
				isDefault: data.isDefault,
			};
			if (modal.editing) {
				await updateMut.mutateAsync({ id: modal.editing.id, payload });
			} else {
				const created = await createMut.mutateAsync(payload);
				setSelectedId(created.id);
			}
			setModal({ open: false, editing: null });
		} catch {
			// toast handled by mutation
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Remover esta maquina?')) return;
		try {
			await deleteMut.mutateAsync(id);
			if (selectedId === id) setSelectedId(null);
		} catch {
			// toast handled by mutation
		}
	}

	// Build lookup params from selected machine + variação atual
	// (variantId faz uma associação variant-level do produto bater)
	const lookupParams: ParameterLookupParams | undefined = selected?.machineId
		? {
				machineId: selected.machineId,
				...(selected.powerOptionId && {
					powerOptionId: selected.powerOptionId,
				}),
				...(selected.lensOptionId && {
					lensOptionId: selected.lensOptionId,
				}),
				...(selected.softwareOptionId && {
					softwareOptionId: selected.softwareOptionId,
				}),
				...(selected.axisOptionId && {
					axisOptionId: selected.axisOptionId,
				}),
				...(selected.operationOptionId && {
					operationOptionId: selected.operationOptionId,
				}),
				...(variantId && { variantId }),
			}
		: undefined;

	const {
		data: lookupResult,
		isLoading: lookupLoading,
		isError: lookupError,
	} = useParameterLookup(
		productId,
		lookupParams,
		showLookup && !!selected && !!productId,
	);

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-4">
				<Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
				<span className="text-sm text-slate-500">Carregando maquinas...</span>
			</div>
		);
	}

	const hasMachines = !!savedMachines?.length;

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
				<Settings className="w-4 h-4 text-violet-600" />
				<h4 className="font-semibold text-sm text-slate-900 dark:text-white flex-1">
					Minhas Maquinas
				</h4>
				<button
					type="button"
					onClick={() => setModal({ open: true, editing: null })}
					className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
				>
					<Plus className="w-3 h-3" />
					Adicionar
				</button>
			</div>

			<div className="p-5 space-y-4">
				{!hasMachines ? (
					<div className="text-center py-6">
						<Settings className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
						<p className="text-sm text-slate-500 dark:text-gray-400 mb-3">
							Nenhuma maquina cadastrada
						</p>
						<button
							type="button"
							onClick={() => setModal({ open: true, editing: null })}
							className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline"
						>
							Adicionar primeira maquina
						</button>
					</div>
				) : (
					<>
						{/* Machine cards */}
						<div className="space-y-2">
							{savedMachines.map((m) => {
								const catalog = machineMap.get(m.machineId);
								const isSelected = selectedId === m.id;
								return (
									// biome-ignore lint/a11y/useKeyWithClickEvents: inner buttons handle actions
									<div
										key={m.id}
										className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all w-full text-left ${
											isSelected
												? 'border-violet-500 bg-violet-50/50 dark:bg-violet-500/5 ring-1 ring-violet-500/30'
												: 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
										}`}
										onClick={() => {
											setSelectedId(m.id);
											setShowLookup(false);
										}}
									>
										<div
											className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
												isSelected
													? 'bg-violet-100 dark:bg-violet-500/20'
													: 'bg-slate-100 dark:bg-white/10'
											}`}
										>
											<Settings
												className={`w-4 h-4 ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-1.5">
												<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
													{m.name || catalog?.name || 'Maquina'}
												</p>
												{m.isDefault && (
													<Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
												)}
											</div>
											{catalog && m.name && (
												<p className="text-xs text-slate-400 dark:text-gray-500 truncate">
													{catalog.name}
												</p>
											)}
										</div>
										<div className="flex items-center gap-1 shrink-0">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setModal({ open: true, editing: m });
												}}
												className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
												title="Editar"
											>
												<Pencil className="w-3.5 h-3.5" />
											</button>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													void handleDelete(m.id);
												}}
												className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
												title="Remover"
											>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>
								);
							})}
						</div>

						{/* Generate parameter button */}
						{selected && productId && (
							<button
								type="button"
								onClick={() => setShowLookup(true)}
								className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
							>
								<Zap className="w-4 h-4" />
								Gerar Parametro para Minha Maquina
							</button>
						)}
					</>
				)}

				{/* Lookup result */}
				{showLookup && selected && (
					<div className="space-y-3">
						{lookupLoading ? (
							<div className="flex items-center justify-center gap-2 py-6">
								<Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
								<span className="text-sm text-slate-500">
									Buscando parametro...
								</span>
							</div>
						) : lookupError || !lookupResult ? (
							<div className="p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
								<div className="flex items-center justify-between">
									<p className="text-sm text-slate-500 dark:text-gray-400">
										Parametro nao encontrado para esta maquina/configuracao.
									</p>
									<button
										type="button"
										onClick={() => setShowLookup(false)}
										className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded"
									>
										<X className="w-3.5 h-3.5 text-slate-400" />
									</button>
								</div>
							</div>
						) : (
							<div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 overflow-hidden">
								<div className="flex items-center justify-between px-4 py-2.5 bg-emerald-100 dark:bg-emerald-500/10">
									<p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
										Parametro de Gravacao
									</p>
									<button
										type="button"
										onClick={() => setShowLookup(false)}
										className="p-1 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 rounded"
									>
										<X className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
									</button>
								</div>
								<div className="p-4 space-y-3">
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Material
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.material || '\u2014'}
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Potencia
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.power}W
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Velocidade
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.speed}mm/s
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Frequencia
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.frequency}kHz
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Passadas
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.passes}x
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Modo
											</span>
											<p className="font-medium text-slate-900 dark:text-white capitalize">
												{lookupResult.parameter.mode || '\u2014'}
											</p>
										</div>
									</div>
									{lookupResult.parameter.notes && (
										<div className="p-3 rounded-lg bg-white/60 dark:bg-white/5 text-sm text-slate-700 dark:text-gray-300">
											{lookupResult.parameter.notes}
										</div>
									)}
									{lookupResult.lesson && (
										<div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10">
											<Play className="w-8 h-8 text-violet-600 shrink-0" />
											<div className="min-w-0 flex-1">
												<p className="font-medium text-sm text-slate-900 dark:text-white truncate">
													{lookupResult.lesson.title}
												</p>
												{lookupResult.lesson.duration && (
													<p className="text-xs text-slate-500 dark:text-gray-400">
														{Math.ceil(lookupResult.lesson.duration / 60)} min
													</p>
												)}
											</div>
											<a
												href={lookupResult.lesson.videoUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shrink-0"
											>
												Assistir
											</a>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Modal */}
			{modal.open && (
				<MachineFormModal
					editing={modal.editing}
					onClose={() => setModal({ open: false, editing: null })}
					onSave={(data) => void handleSave(data)}
					saving={createMut.isPending || updateMut.isPending}
				/>
			)}
		</div>
	);
}
