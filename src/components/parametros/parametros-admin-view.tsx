'use client';

import {
	Cpu,
	Download,
	Filter,
	Layers,
	Loader2,
	Pencil,
	Plus,
	Search,
	SlidersHorizontal,
	Table,
	Trash2,
	Users,
	X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
	useCreateParameter,
	useDeleteParameter,
	useExportParameters,
	useParameterMachines,
	useParameterMaterials,
	useParameterStats,
	useParameters,
	useUpdateParameter,
} from '@/hooks/use-parameters';
import type { CreateParameterPayload } from '@/services/parameters';
import type { LaserParameter } from '@/types/parameters';

/* ------------------------------------------------------------------ */
/*  Stats config                                                       */
/* ------------------------------------------------------------------ */

const STATS_CONFIG = [
	{
		key: 'totalParameters' as const,
		label: 'Parametros',
		icon: Table,
		color: 'text-violet-600 dark:text-violet-400',
		bg: 'bg-violet-100 dark:bg-violet-500/20',
	},
	{
		key: 'totalMachines' as const,
		label: 'Maquinas',
		icon: Cpu,
		color: 'text-blue-600 dark:text-blue-400',
		bg: 'bg-blue-100 dark:bg-blue-500/20',
	},
	{
		key: 'totalMaterials' as const,
		label: 'Materiais',
		icon: Layers,
		color: 'text-emerald-600 dark:text-emerald-400',
		bg: 'bg-emerald-100 dark:bg-emerald-500/20',
	},
	{
		key: 'totalContributors' as const,
		label: 'Contribuidores',
		icon: Users,
		color: 'text-amber-600 dark:text-amber-400',
		bg: 'bg-amber-100 dark:bg-amber-500/20',
	},
];

/* ------------------------------------------------------------------ */
/*  Empty form helper                                                  */
/* ------------------------------------------------------------------ */

const EMPTY_FORM: CreateParameterPayload = {
	material: '',
	materialType: '',
	thickness: '',
	power: 0,
	speed: 0,
	frequency: 0,
	passes: 1,
	mode: 'Corte',
	gas: '',
	machine: '',
	notes: '',
	isPublic: true,
};

/* ------------------------------------------------------------------ */
/*  Shared classes                                                     */
/* ------------------------------------------------------------------ */

const selectCls =
	'px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';

const inputCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ParametrosAdminView() {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterMachine, setFilterMachine] = useState('');
	const [filterMaterial, setFilterMaterial] = useState('');
	const [filterThickness, setFilterThickness] = useState('');
	const [filterMode, setFilterMode] = useState('');
	const limit = 20;

	/* modals */
	const [showCreate, setShowCreate] = useState(false);
	const [editTarget, setEditTarget] = useState<LaserParameter | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<LaserParameter | null>(null);

	/* hooks */
	const { data: statsData } = useParameterStats();
	const { data: machines = [] } = useParameterMachines();
	const { data: materials = [] } = useParameterMaterials();

	const queryParams = useMemo(
		() => ({
			page: currentPage,
			limit,
			...(searchQuery && { search: searchQuery }),
			...(filterMachine && { machine: filterMachine }),
			...(filterMaterial && { material: filterMaterial }),
			...(filterThickness && { thickness: filterThickness }),
			...(filterMode && { mode: filterMode }),
		}),
		[
			currentPage,
			searchQuery,
			filterMachine,
			filterMaterial,
			filterThickness,
			filterMode,
		],
	);

	const { data: parametersData, isLoading } = useParameters(queryParams);
	const parameters = parametersData?.data ?? [];
	const total = parametersData?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const createMutation = useCreateParameter();
	const updateMutation = useUpdateParameter();
	const deleteMutation = useDeleteParameter();
	const exportMutation = useExportParameters();

	const thicknesses = useMemo(() => {
		const set = new Set<string>();
		for (const m of materials) {
			m.commonThicknesses?.forEach((t) => {
				set.add(t);
			});
		}
		return Array.from(set).sort();
	}, [materials]);

	const handleClearFilters = () => {
		setFilterMachine('');
		setFilterMaterial('');
		setFilterThickness('');
		setFilterMode('');
		setSearchQuery('');
		setCurrentPage(1);
	};

	const handleExport = () => exportMutation.mutate(queryParams);

	const showingFrom = total === 0 ? 0 : (currentPage - 1) * limit + 1;
	const showingTo = Math.min(currentPage * limit, total);

	return (
		<>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
						<SlidersHorizontal className="w-6 h-6 text-violet-500" />
						Gestao de Parametros
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Crie, edite e exclua parametros de corte e gravacao laser.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowCreate(true)}
					className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo parametro
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{STATS_CONFIG.map((s) => {
					const value = statsData ? statsData[s.key] : '—';
					return (
						<div
							key={s.label}
							className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4"
						>
							<div
								className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.bg}`}
							>
								<s.icon className={`w-5 h-5 ${s.color}`} />
							</div>
							<div>
								<p className="text-xl font-bold text-slate-900 dark:text-white">
									{typeof value === 'number'
										? value.toLocaleString('pt-BR')
										: value}
								</p>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{s.label}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Filter bar */}
			<div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
				<Filter className="w-4 h-4 text-slate-400" />

				<select
					className={selectCls}
					value={filterMachine}
					onChange={(e) => {
						setFilterMachine(e.target.value);
						setCurrentPage(1);
					}}
				>
					<option value="">Maquina</option>
					{machines.map((m) => (
						<option key={m.id} value={m.brand}>
							{m.brand} {m.model}
						</option>
					))}
				</select>

				<select
					className={selectCls}
					value={filterMaterial}
					onChange={(e) => {
						setFilterMaterial(e.target.value);
						setCurrentPage(1);
					}}
				>
					<option value="">Material</option>
					{materials.map((m) => (
						<option key={m.id} value={m.name}>
							{m.name}
						</option>
					))}
				</select>

				<select
					className={selectCls}
					value={filterThickness}
					onChange={(e) => {
						setFilterThickness(e.target.value);
						setCurrentPage(1);
					}}
				>
					<option value="">Espessura</option>
					{thicknesses.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>

				<select
					className={selectCls}
					value={filterMode}
					onChange={(e) => {
						setFilterMode(e.target.value);
						setCurrentPage(1);
					}}
				>
					<option value="">Modo</option>
					<option value="Corte">Corte</option>
					<option value="Gravacao">Gravacao</option>
				</select>

				<div className="ml-auto flex items-center gap-2">
					<button
						type="button"
						onClick={handleClearFilters}
						className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
					>
						Limpar
					</button>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<input
							type="text"
							placeholder="Buscar..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && setCurrentPage(1)}
							className="pl-9 pr-4 py-2 w-40 md:w-52 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
						/>
					</div>
				</div>
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-8 h-8 animate-spin text-violet-500" />
				</div>
			) : parameters.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
					<Table className="w-12 h-12 mb-3" />
					<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
						Nenhum parametro encontrado
					</p>
				</div>
			) : (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none mb-4">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
								<th className="px-4 py-3 font-medium">Material</th>
								<th className="px-4 py-3 font-medium">Tipo</th>
								<th className="px-4 py-3 font-medium">Espessura</th>
								<th className="px-4 py-3 font-medium">Potencia</th>
								<th className="px-4 py-3 font-medium">Velocidade</th>
								<th className="px-4 py-3 font-medium">Frequencia</th>
								<th className="px-4 py-3 font-medium">Passadas</th>
								<th className="px-4 py-3 font-medium">Modo</th>
								<th className="px-4 py-3 font-medium">Gas</th>
								<th className="px-4 py-3 font-medium">Maquina</th>
								<th className="px-4 py-3 font-medium">Publico</th>
								<th className="px-4 py-3 font-medium text-right">Acoes</th>
							</tr>
						</thead>
						<tbody>
							{parameters.map((p) => (
								<tr
									key={p.id}
									className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
								>
									<td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
										{p.material}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.materialType}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.thickness}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.power}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.speed}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.frequency}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.passes}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
												p.mode === 'Corte'
													? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
													: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
											}`}
										>
											{p.mode}
										</span>
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.gas || '—'}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{p.machine || '—'}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
												p.isPublic
													? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
													: 'bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400'
											}`}
										>
											{p.isPublic ? 'Sim' : 'Nao'}
										</span>
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() => setEditTarget(p)}
												className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
												title="Editar"
											>
												<Pencil className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() => setDeleteTarget(p)}
												className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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

			{/* Pagination + Export */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<p className="text-sm text-slate-500 dark:text-slate-400">
					Mostrando{' '}
					<span className="font-semibold text-slate-700 dark:text-slate-300">
						{showingFrom} a {showingTo}
					</span>{' '}
					de{' '}
					<span className="font-semibold text-slate-700 dark:text-slate-300">
						{total.toLocaleString('pt-BR')}
					</span>
				</p>

				<div className="flex items-center gap-3">
					{totalPages > 1 && (
						<div className="flex items-center gap-1">
							<button
								type="button"
								disabled={currentPage === 1}
								onClick={() => setCurrentPage((p) => p - 1)}
								className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
							>
								Anterior
							</button>

							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((page) => {
									if (totalPages <= 7) return true;
									if (page === 1 || page === totalPages) return true;
									return Math.abs(page - currentPage) <= 1;
								})
								.map((page, idx, arr) => {
									const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
									return (
										<span key={page} className="flex items-center">
											{showEllipsis && (
												<span className="px-1 text-slate-400">...</span>
											)}
											<button
												type="button"
												onClick={() => setCurrentPage(page)}
												className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
													page === currentPage
														? 'bg-violet-600 text-white'
														: 'text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-500/10'
												}`}
											>
												{page}
											</button>
										</span>
									);
								})}

							<button
								type="button"
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage((p) => p + 1)}
								className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
							>
								Proximo
							</button>
						</div>
					)}

					<button
						type="button"
						onClick={handleExport}
						disabled={exportMutation.isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
					>
						{exportMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Download className="w-4 h-4" />
						)}
						Exportar CSV
					</button>
				</div>
			</div>

			{/* Modals */}
			{showCreate && (
				<ParameterFormModal
					title="Novo parametro"
					initial={EMPTY_FORM}
					isPending={createMutation.isPending}
					onClose={() => setShowCreate(false)}
					onSubmit={(payload) => {
						createMutation.mutate(payload, {
							onSuccess: () => setShowCreate(false),
						});
					}}
				/>
			)}

			{editTarget && (
				<ParameterFormModal
					title="Editar parametro"
					initial={{
						material: editTarget.material,
						materialType: editTarget.materialType,
						thickness: editTarget.thickness,
						power: editTarget.power,
						speed: editTarget.speed,
						frequency: editTarget.frequency,
						passes: editTarget.passes,
						mode: editTarget.mode,
						gas: editTarget.gas ?? '',
						machine: editTarget.machine ?? '',
						notes: editTarget.notes ?? '',
						isPublic: editTarget.isPublic,
					}}
					isPending={updateMutation.isPending}
					onClose={() => setEditTarget(null)}
					onSubmit={(payload) => {
						updateMutation.mutate(
							{ id: editTarget.id, payload },
							{ onSuccess: () => setEditTarget(null) },
						);
					}}
				/>
			)}

			{deleteTarget && (
				<DeleteParameterModal
					parameter={deleteTarget}
					isPending={deleteMutation.isPending}
					onClose={() => setDeleteTarget(null)}
					onConfirm={() => {
						deleteMutation.mutate(deleteTarget.id, {
							onSuccess: () => setDeleteTarget(null),
						});
					}}
				/>
			)}
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  Form Modal (create + edit)                                         */
/* ------------------------------------------------------------------ */

function ParameterFormModal({
	title,
	initial,
	isPending,
	onClose,
	onSubmit,
}: {
	title: string;
	initial: CreateParameterPayload;
	isPending: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateParameterPayload) => void;
}) {
	const [form, setForm] = useState<CreateParameterPayload>(initial);

	const set = (
		field: keyof CreateParameterPayload,
		value: string | number | boolean,
	) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(form);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl p-6">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{title}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Material *
							</span>
							<input
								required
								className={inputCls}
								value={form.material}
								onChange={(e) => set('material', e.target.value)}
							/>
						</div>
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Tipo de material *
							</span>
							<input
								required
								className={inputCls}
								value={form.materialType}
								onChange={(e) => set('materialType', e.target.value)}
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Espessura *
							</span>
							<input
								required
								className={inputCls}
								value={form.thickness}
								onChange={(e) => set('thickness', e.target.value)}
							/>
						</div>
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Potencia (%) *
							</span>
							<input
								required
								type="number"
								min={0}
								className={inputCls}
								value={form.power || ''}
								onChange={(e) => set('power', Number(e.target.value))}
							/>
						</div>
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Velocidade (mm/s) *
							</span>
							<input
								required
								type="number"
								min={0}
								className={inputCls}
								value={form.speed || ''}
								onChange={(e) => set('speed', Number(e.target.value))}
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Frequencia (Hz) *
							</span>
							<input
								required
								type="number"
								min={0}
								className={inputCls}
								value={form.frequency || ''}
								onChange={(e) => set('frequency', Number(e.target.value))}
							/>
						</div>
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Passadas *
							</span>
							<input
								required
								type="number"
								min={1}
								className={inputCls}
								value={form.passes || ''}
								onChange={(e) => set('passes', Number(e.target.value))}
							/>
						</div>
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Modo *
							</span>
							<select
								required
								className={inputCls}
								value={form.mode}
								onChange={(e) => set('mode', e.target.value)}
							>
								<option value="Corte">Corte</option>
								<option value="Gravacao">Gravacao</option>
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Gas
							</span>
							<input
								className={inputCls}
								value={form.gas ?? ''}
								onChange={(e) => set('gas', e.target.value)}
							/>
						</div>
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Maquina
							</span>
							<input
								className={inputCls}
								value={form.machine ?? ''}
								onChange={(e) => set('machine', e.target.value)}
							/>
						</div>
					</div>

					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Notas
						</span>
						<textarea
							rows={3}
							className={inputCls}
							value={form.notes ?? ''}
							onChange={(e) => set('notes', e.target.value)}
						/>
					</div>

					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={form.isPublic ?? true}
							onChange={(e) => set('isPublic', e.target.checked)}
							className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
						/>
						<span className="text-sm text-slate-700 dark:text-slate-300">
							Publico (visivel para alunos)
						</span>
					</label>

					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
						>
							{isPending && <Loader2 className="w-4 h-4 animate-spin" />}
							Salvar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Delete Modal                                                       */
/* ------------------------------------------------------------------ */

function DeleteParameterModal({
	parameter,
	isPending,
	onClose,
	onConfirm,
}: {
	parameter: LaserParameter;
	isPending: boolean;
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="relative w-full max-w-md mx-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Excluir parametro
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
					Tem certeza que deseja excluir o parametro{' '}
					<span className="font-semibold text-slate-900 dark:text-white">
						{parameter.material} — {parameter.thickness}
					</span>
					? Esta acao nao pode ser desfeita.
				</p>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
					>
						{isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						Excluir
					</button>
				</div>
			</div>
		</div>
	);
}
