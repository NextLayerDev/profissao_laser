'use client';

import {
	ChevronDown,
	ChevronUp,
	Loader2,
	Play,
	Settings,
	X,
	Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	useCustomerMachine,
	useMachines,
	useSaveCustomerMachine,
} from '@/hooks/use-machines';
import { useParameterLookup } from '@/hooks/use-product-parameters';
import type { MachineOptionCategory } from '@/types/machines';
import type { ParameterLookupParams } from '@/types/product-parameters';

const selectCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';

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

export function MyMachineSection({ productId }: { productId: string | null }) {
	const { data: machines } = useMachines();
	const { data: savedMachine, isLoading: savedLoading } = useCustomerMachine();
	const saveMutation = useSaveCustomerMachine();

	const [machineId, setMachineId] = useState('');
	const [powerOptionId, setPowerOptionId] = useState('');
	const [lensOptionId, setLensOptionId] = useState('');
	const [softwareOptionId, setSoftwareOptionId] = useState('');
	const [axisOptionId, setAxisOptionId] = useState('');
	const [operationOptionId, setOperationOptionId] = useState('');

	const [showLookup, setShowLookup] = useState(false);
	const [expanded, setExpanded] = useState(false);

	// Populate from saved machine
	useEffect(() => {
		if (savedMachine) {
			setMachineId(savedMachine.machineId);
			setPowerOptionId(savedMachine.powerOptionId ?? '');
			setLensOptionId(savedMachine.lensOptionId ?? '');
			setSoftwareOptionId(savedMachine.softwareOptionId ?? '');
			setAxisOptionId(savedMachine.axisOptionId ?? '');
			setOperationOptionId(savedMachine.operationOptionId ?? '');
		}
	}, [savedMachine]);

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
		setShowLookup(false);
	}

	async function handleSave() {
		if (!machineId) return;
		await saveMutation.mutateAsync({
			machineId,
			powerOptionId: powerOptionId || undefined,
			lensOptionId: lensOptionId || undefined,
			softwareOptionId: softwareOptionId || undefined,
			axisOptionId: axisOptionId || undefined,
			operationOptionId: operationOptionId || undefined,
		});
	}

	// Build lookup params
	const lookupParams: ParameterLookupParams | undefined = machineId
		? {
				machineId,
				...(powerOptionId && { powerOptionId }),
				...(lensOptionId && { lensOptionId }),
				...(softwareOptionId && { softwareOptionId }),
				...(axisOptionId && { axisOptionId }),
				...(operationOptionId && { operationOptionId }),
			}
		: undefined;

	const {
		data: lookupResult,
		isLoading: lookupLoading,
		isError: lookupError,
	} = useParameterLookup(
		productId,
		lookupParams,
		showLookup && !!machineId && !!productId,
	);

	if (savedLoading) {
		return (
			<div className="flex items-center gap-2 py-4">
				<Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
				<span className="text-sm text-slate-500">Carregando maquina...</span>
			</div>
		);
	}

	const hasSavedMachine = !!savedMachine && !!machineId;

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
				<Settings className="w-4 h-4 text-violet-600" />
				<h4 className="font-semibold text-sm text-slate-900 dark:text-white flex-1">
					Minha Maquina
				</h4>
				{hasSavedMachine && selectedMachine && (
					<span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-full">
						{selectedMachine.name}
					</span>
				)}
			</div>

			<div className="p-5 space-y-4">
				{/* Compact view when machine is saved */}
				{hasSavedMachine && !expanded ? (
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
								<Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-slate-900 dark:text-white">
									{selectedMachine?.name ?? 'Maquina salva'}
								</p>
								<p className="text-xs text-slate-500 dark:text-gray-400">
									Configuracao salva e pronta para uso
								</p>
							</div>
							<button
								type="button"
								onClick={() => setExpanded(true)}
								className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								Editar
								<ChevronDown className="w-3 h-3" />
							</button>
						</div>
						{productId && (
							<button
								type="button"
								onClick={() => setShowLookup(true)}
								className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
							>
								<Zap className="w-4 h-4" />
								Gerar Parametro para Minha Maquina
							</button>
						)}
					</div>
				) : (
					<>
						{hasSavedMachine && (
							<button
								type="button"
								onClick={() => setExpanded(false)}
								className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline"
							>
								<ChevronUp className="w-3 h-3" />
								Recolher
							</button>
						)}

						{/* Machine selector */}
						<div>
							<span className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block">
								Tipo de Maquina
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

						{/* Dynamic option selectors */}
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

						{/* Action buttons */}
						{machineId && (
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									disabled={saveMutation.isPending}
									onClick={() => void handleSave()}
									className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition-colors disabled:opacity-50"
								>
									{saveMutation.isPending ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Settings className="w-3.5 h-3.5" />
									)}
									Salvar Maquina
								</button>
								{productId && (
									<button
										type="button"
										onClick={() => setShowLookup(true)}
										className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-700 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
									>
										<Zap className="w-3.5 h-3.5" />
										Ver Parametro de Gravacao
									</button>
								)}
							</div>
						)}
					</>
				)}

				{/* Lookup result */}
				{showLookup && (
					<div className="space-y-3">
						{!machineId ? (
							<div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
								<p className="text-sm text-amber-700 dark:text-amber-400">
									Configure sua maquina primeiro para ver o parametro de
									gravacao.
								</p>
							</div>
						) : lookupLoading ? (
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
												{lookupResult.parameter.material || '—'}
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Tipo
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.materialType || '—'}
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Espessura
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.thickness || '—'}
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
												{lookupResult.parameter.speed}
												mm/s
											</p>
										</div>
										<div>
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Frequencia
											</span>
											<p className="font-medium text-slate-900 dark:text-white">
												{lookupResult.parameter.frequency}
												kHz
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
												{lookupResult.parameter.mode || '—'}
											</p>
										</div>
										{lookupResult.parameter.gas && (
											<div>
												<span className="text-xs text-slate-500 dark:text-gray-400">
													Gas
												</span>
												<p className="font-medium text-slate-900 dark:text-white">
													{lookupResult.parameter.gas}
												</p>
											</div>
										)}
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
		</div>
	);
}
