'use client';

import { useQuery } from '@tanstack/react-query';
import {
	ChevronLeft,
	Loader2,
	Pencil,
	Plus,
	Trash2,
	Video,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMachines } from '@/hooks/use-machines';
import {
	useCreateProductParameter,
	useDeleteProductParameter,
	useProductParameters,
	useUpdateProductParameter,
} from '@/hooks/use-product-parameters';
import { getCourse } from '@/services/course';
import { getProducts } from '@/services/products';
import type { Machine, MachineOptionCategory } from '@/types/machines';
import type {
	CreateProductParameterPayload,
	ProductParameter,
} from '@/types/product-parameters';

const inputCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

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

/* ------------------------------------------------------------------ */
/*  Lesson Picker                                                       */
/* ------------------------------------------------------------------ */

interface LessonOption {
	id: string;
	title: string;
	moduleName: string;
	courseName: string;
}

function LessonPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (id: string) => void;
}) {
	const { data: lessons, isLoading } = useQuery({
		queryKey: ['all-lessons-for-picker'],
		queryFn: async () => {
			const products = await getProducts();
			const cursoProducts = products.filter((p) => p.type === 'curso');
			const allLessons: LessonOption[] = [];
			for (const product of cursoProducts) {
				try {
					const course = await getCourse(product.slug);
					for (const mod of course.modules) {
						for (const lesson of mod.lessons) {
							if (lesson.videoUrl) {
								allLessons.push({
									id: lesson.id,
									title: lesson.title,
									moduleName: mod.title,
									courseName: course.name,
								});
							}
						}
					}
				} catch {
					// skip
				}
			}
			return allLessons;
		},
		staleTime: 5 * 60_000,
	});

	const grouped = useMemo(() => {
		if (!lessons) return new Map<string, LessonOption[]>();
		const map = new Map<string, LessonOption[]>();
		for (const l of lessons) {
			const key = `${l.courseName} > ${l.moduleName}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key)?.push(l);
		}
		return map;
	}, [lessons]);

	return (
		<div>
			<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
				Video-Aula (opcional)
			</span>
			{isLoading ? (
				<div className="flex items-center gap-2 py-2">
					<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
					<span className="text-xs text-slate-400">Carregando aulas...</span>
				</div>
			) : (
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={selectCls}
				>
					<option value="">Nenhuma aula</option>
					{[...grouped.entries()].map(([group, items]) => (
						<optgroup key={group} label={group}>
							{items.map((l) => (
								<option key={l.id} value={l.id}>
									{l.title}
								</option>
							))}
						</optgroup>
					))}
				</select>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Association Modal                                                   */
/* ------------------------------------------------------------------ */

function AssociationModal({
	editing,
	machines,
	onClose,
	onSave,
	saving,
}: {
	editing: ProductParameter | null;
	machines: Machine[];
	onClose: () => void;
	onSave: (data: CreateProductParameterPayload) => void;
	saving: boolean;
}) {
	const [machineId, setMachineId] = useState(editing?.machineId ?? '');
	const [createInline, setCreateInline] = useState(false);

	// Inline parameter fields
	const [material, setMaterial] = useState(editing?.parameter?.material ?? '');
	const [materialType, setMaterialType] = useState(
		editing?.parameter?.materialType ?? '',
	);
	const [thickness, setThickness] = useState(
		editing?.parameter?.thickness ?? '',
	);
	const [power, setPower] = useState(editing?.parameter?.power ?? 0);
	const [speed, setSpeed] = useState(editing?.parameter?.speed ?? 0);
	const [frequency, setFrequency] = useState(
		editing?.parameter?.frequency ?? 0,
	);
	const [passes, setPasses] = useState(editing?.parameter?.passes ?? 1);
	const [mode, setMode] = useState(editing?.parameter?.mode ?? '');
	const [gas, setGas] = useState(editing?.parameter?.gas ?? '');
	const [notes, setNotes] = useState(editing?.parameter?.notes ?? '');

	// Machine option selections
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
	const [lessonId, setLessonId] = useState(editing?.lessonId ?? '');

	const selectedMachine = machines.find((m) => m.id === machineId);

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

	// Reset option selections when machine changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: machineId is intentional trigger
	useEffect(() => {
		if (!editing) {
			setPowerOptionId('');
			setLensOptionId('');
			setSoftwareOptionId('');
			setAxisOptionId('');
			setOperationOptionId('');
		}
	}, [machineId, editing]);

	const canSave =
		machineId && (createInline ? material.trim() && mode.trim() : true);

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar Associacao' : 'Nova Associacao de Parametro'}
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
					{/* Machine selection */}
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Maquina *
						</span>
						<select
							value={machineId}
							onChange={(e) => setMachineId(e.target.value)}
							className={selectCls}
						>
							<option value="">Selecione uma maquina</option>
							{machines.map((m) => (
								<option key={m.id} value={m.id}>
									{m.name}
								</option>
							))}
						</select>
					</div>

					{/* Machine options */}
					{selectedMachine && (
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{OPTION_CATEGORIES.map((cat) => {
								const opts = selectedMachine.options[cat].filter(
									(o) => o.status === 'ativo',
								);
								if (opts.length === 0) return null;
								return (
									<div key={cat}>
										<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
											{OPTION_LABELS[cat]}
										</span>
										<select
											value={optionValues[cat]}
											onChange={(e) => optionSetters[cat](e.target.value)}
											className={selectCls}
										>
											<option value="">Qualquer</option>
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

					{/* Toggle: inline parameter */}
					{!editing && (
						<label className="flex items-center gap-3 cursor-pointer">
							<button
								type="button"
								role="switch"
								aria-checked={createInline}
								onClick={() => setCreateInline(!createInline)}
								className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${createInline ? 'bg-violet-600' : 'bg-slate-300 dark:bg-white/20'}`}
							>
								<span
									className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${createInline ? 'translate-x-[18px]' : 'translate-x-0'}`}
								/>
							</button>
							<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
								Criar parametro inline
							</span>
						</label>
					)}

					{/* Inline parameter form */}
					{(createInline || editing) && (
						<div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
							<p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
								Parametros de Gravacao
							</p>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Material *
									</span>
									<input
										type="text"
										value={material}
										onChange={(e) => setMaterial(e.target.value)}
										placeholder="Ex: Aco Inox"
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Tipo Material
									</span>
									<input
										type="text"
										value={materialType}
										onChange={(e) => setMaterialType(e.target.value)}
										placeholder="Ex: 304"
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Espessura
									</span>
									<input
										type="text"
										value={thickness}
										onChange={(e) => setThickness(e.target.value)}
										placeholder="Ex: 1mm"
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Potencia (W)
									</span>
									<input
										type="number"
										value={power}
										onChange={(e) => setPower(Number(e.target.value))}
										min={0}
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Velocidade (mm/s)
									</span>
									<input
										type="number"
										value={speed}
										onChange={(e) => setSpeed(Number(e.target.value))}
										min={0}
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Frequencia (kHz)
									</span>
									<input
										type="number"
										value={frequency}
										onChange={(e) => setFrequency(Number(e.target.value))}
										min={0}
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Passadas
									</span>
									<input
										type="number"
										value={passes}
										onChange={(e) => setPasses(Number(e.target.value))}
										min={1}
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Modo *
									</span>
									<input
										type="text"
										value={mode}
										onChange={(e) => setMode(e.target.value)}
										placeholder="Ex: gravacao, corte"
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
										Gas
									</span>
									<input
										type="text"
										value={gas}
										onChange={(e) => setGas(e.target.value)}
										placeholder="Ex: ar, nitrogenio"
										className={inputCls}
									/>
								</div>
							</div>
							<div>
								<span className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">
									Notas
								</span>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={2}
									placeholder="Observacoes sobre o parametro..."
									className={`${inputCls} resize-none`}
								/>
							</div>
						</div>
					)}

					{/* Lesson picker */}
					<LessonPicker value={lessonId} onChange={setLessonId} />
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
						disabled={saving || !canSave}
						onClick={() => {
							const payload: CreateProductParameterPayload = {
								machineId,
								powerOptionId: powerOptionId || undefined,
								lensOptionId: lensOptionId || undefined,
								softwareOptionId: softwareOptionId || undefined,
								axisOptionId: axisOptionId || undefined,
								operationOptionId: operationOptionId || undefined,
								lessonId: lessonId || undefined,
							};
							if (createInline || editing) {
								payload.parameter = {
									material: material.trim(),
									materialType: materialType.trim(),
									thickness: thickness.trim(),
									power,
									speed,
									frequency,
									passes,
									mode: mode.trim(),
									gas: gas.trim() || undefined,
									notes: notes.trim() || undefined,
								};
							}
							onSave(payload);
						}}
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

export function ProductParametersSection({
	productId,
	productName,
	onBack,
}: {
	productId: string;
	productName: string;
	onBack: () => void;
}) {
	const { data: params, isLoading } = useProductParameters(productId);
	const { data: machines } = useMachines();
	const createMut = useCreateProductParameter();
	const updateMut = useUpdateProductParameter();
	const deleteMut = useDeleteProductParameter();

	const [modal, setModal] = useState<{
		open: boolean;
		editing: ProductParameter | null;
	}>({ open: false, editing: null });

	const machineMap = new Map((machines ?? []).map((m) => [m.id, m]));

	async function handleSave(payload: CreateProductParameterPayload) {
		try {
			if (modal.editing) {
				await updateMut.mutateAsync({
					productId,
					assocId: modal.editing.id,
					payload,
				});
			} else {
				await createMut.mutateAsync({ productId, payload });
			}
			setModal({ open: false, editing: null });
		} catch {
			// toast handled by mutation
		}
	}

	async function handleDelete(assocId: string) {
		if (!confirm('Excluir esta associacao?')) return;
		try {
			await deleteMut.mutateAsync({ productId, assocId });
		} catch {
			// toast handled by mutation
		}
	}

	function hasOptions(p: ProductParameter): boolean {
		return !!(
			p.powerOptionId ||
			p.lensOptionId ||
			p.softwareOptionId ||
			p.axisOptionId ||
			p.operationOptionId
		);
	}

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
						Parametros: {productName}
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						{params?.length ?? 0} associacao
						{(params?.length ?? 0) !== 1 ? 'es' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors text-sm"
				>
					<Plus className="w-4 h-4" />
					Nova Associacao
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
				</div>
			) : !params?.length ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhum parametro associado
					</p>
					<button
						type="button"
						onClick={() => setModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium"
					>
						Criar primeira associacao
					</button>
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 dark:bg-white/5">
							<tr>
								<th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Maquina
								</th>
								<th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Parametro
								</th>
								<th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Config
								</th>
								<th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Video
								</th>
								<th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Acoes
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-gray-800">
							{params.map((p) => {
								const machine = machineMap.get(p.machineId);
								return (
									<tr
										key={p.id}
										className="bg-white dark:bg-[#1a1a1d] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
									>
										<td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
											{machine?.name ?? p.machineId}
										</td>
										<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
											<div className="text-xs">
												{p.parameter?.material}{' '}
												{p.parameter?.materialType &&
													`(${p.parameter.materialType})`}
											</div>
											<div className="text-xs text-slate-400 dark:text-gray-500">
												{p.parameter?.power}W · {p.parameter?.speed}mm/s ·{' '}
												{p.parameter?.frequency}kHz · {p.parameter?.passes}x
											</div>
										</td>
										<td className="px-4 py-3 text-center">
											<span
												className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
													hasOptions(p)
														? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400'
														: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400'
												}`}
											>
												{hasOptions(p) ? 'Preciso' : 'Simples'}
											</span>
										</td>
										<td className="px-4 py-3 text-center">
											{p.lesson ? (
												<Video className="w-4 h-4 text-emerald-500 mx-auto" />
											) : (
												<span className="text-slate-300 dark:text-gray-600">
													—
												</span>
											)}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-end gap-1">
												<button
													type="button"
													onClick={() =>
														setModal({
															open: true,
															editing: p,
														})
													}
													className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
													title="Editar"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													type="button"
													onClick={() => void handleDelete(p.id)}
													className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
													title="Excluir"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{modal.open && machines && (
				<AssociationModal
					editing={modal.editing}
					machines={machines}
					onClose={() => setModal({ open: false, editing: null })}
					onSave={(data) => void handleSave(data)}
					saving={createMut.isPending || updateMut.isPending}
				/>
			)}
		</div>
	);
}
