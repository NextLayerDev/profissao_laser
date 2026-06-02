'use client';

import {
	Check,
	ClipboardList,
	Cpu,
	Download,
	Filter,
	Image as ImgIcon,
	Layers,
	Loader2,
	Plus,
	Search,
	SlidersHorizontal,
	Table,
	Users,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LaserLineTypesAdminSection } from '@/components/parametros/laser-line-types-admin-section';
import { ParameterForm } from '@/components/parametros/parameter-form';
import { ParameterGridCard } from '@/components/parametros/parameter-grid-card';
import { useMachines } from '@/hooks/use-machines';
import {
	useCreateParameter,
	useDeleteParameter,
	useExportParameters,
	useParameterMaterials,
	useParameterPasses,
	useParameterStats,
	useParameters,
	usePendingParameters,
	useReviewParameter,
	useUpdateParameter,
} from '@/hooks/use-parameters';
import type { CreateParameterPayload, PassRecipe } from '@/services/parameters';
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

const CATEGORY_OPTIONS = [
	'Copos',
	'Metais',
	'Madeira',
	'Acrílico',
	'Brindes',
	'Outros',
];

/* ------------------------------------------------------------------ */
/*  Empty form helper                                                  */
/* ------------------------------------------------------------------ */

const EMPTY_FORM: CreateParameterPayload = {
	machine: '',
	powerWatts: 0,
	lens: '',
	software: '',
	material: '',
	mode: 'Gravacao',
	speed: 0,
	power: 0,
	frequency: 0,
	line: 0,
	crossHatch: false,
	angle: 0,
	passes: 1,
	passesFill: 1,
	gas: false,
	isPublic: true,
	notes: '',
	defocus: undefined,
	materialType: '',
	thickness: '',
	tamanhoLinha: null,
	tamanhoDivisao: null,
	sobreposicao: null,
	forcarSeparacao: null,
	axisRotative: null,
	lineTypeId: null,
};

/* ------------------------------------------------------------------ */
/*  Shared classes                                                     */
/* ------------------------------------------------------------------ */

const selectCls =
	'px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type AdminTab = 'parameters' | 'review' | 'line-types';

export function ParametrosAdminView() {
	const [activeTab, setActiveTab] = useState<AdminTab>('parameters');
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
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bulkCategory, setBulkCategory] = useState('');
	const [bulkPending, setBulkPending] = useState(false);

	/* hooks */
	const { data: statsData } = useParameterStats();
	const { data: machineCatalog = [] } = useMachines();
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

	/* Análise: fila de submissões pendentes + revisão (aprovar/rejeitar) */
	const { data: pendingData, isLoading: pendingLoading } =
		usePendingParameters();
	const pending = pendingData?.data ?? [];
	const pendingCount = pendingData?.total ?? pending.length;
	const reviewMutation = useReviewParameter();
	const [rejectTarget, setRejectTarget] = useState<LaserParameter | null>(null);

	/* seleção em lote: categorizar vários parâmetros de uma vez */
	function toggleSelect(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}
	function toggleSelectAllOnPage(ids: string[], allSelected: boolean) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			for (const id of ids) {
				if (allSelected) next.delete(id);
				else next.add(id);
			}
			return next;
		});
	}
	async function applyBulkCategory() {
		if (!bulkCategory || selectedIds.size === 0) return;
		setBulkPending(true);
		try {
			await Promise.all(
				Array.from(selectedIds).map((id) =>
					updateMutation.mutateAsync({
						id,
						payload: { category: bulkCategory },
					}),
				),
			);
			setSelectedIds(new Set());
			setBulkCategory('');
		} finally {
			setBulkPending(false);
		}
	}
	// Limpa a seleção ao trocar de página/filtro (não agir em itens fora da tela).
	// biome-ignore lint/correctness/useExhaustiveDependencies: limpar nessas mudanças é intencional
	useEffect(() => {
		setSelectedIds(new Set());
	}, [
		currentPage,
		searchQuery,
		filterMachine,
		filterMaterial,
		filterThickness,
		filterMode,
	]);

	const thicknesses = useMemo(() => {
		const set = new Set<string>();
		const source = filterMaterial
			? materials.filter((m) => m.name === filterMaterial)
			: materials;
		for (const m of source) {
			m.commonThicknesses?.forEach((t) => {
				if (t?.trim()) set.add(t.trim());
			});
		}
		return Array.from(set).sort();
	}, [materials, filterMaterial]);

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
	const pageAllSelected =
		parameters.length > 0 && parameters.every((p) => selectedIds.has(p.id));

	return (
		<>
			{/* Header */}
			<div className="flex items-center justify-between mb-6 flex-wrap gap-3">
				<div>
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
						<SlidersHorizontal className="w-6 h-6 text-violet-500" />
						Gestao de Parametros
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Crie, edite e exclua parametros de corte e gravacao laser.
					</p>
				</div>
				{activeTab === 'parameters' && (
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
					>
						<Plus className="w-4 h-4" />
						Novo parametro
					</button>
				)}
			</div>

			{/* Tabs */}
			<div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-white/10">
				<button
					type="button"
					onClick={() => setActiveTab('parameters')}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
						activeTab === 'parameters'
							? 'text-violet-600 dark:text-violet-400 border-violet-500'
							: 'text-slate-600 dark:text-gray-400 border-transparent hover:text-slate-900 dark:hover:text-white'
					}`}
				>
					<Table className="w-4 h-4" />
					Parametros
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('review')}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
						activeTab === 'review'
							? 'text-violet-600 dark:text-violet-400 border-violet-500'
							: 'text-slate-600 dark:text-gray-400 border-transparent hover:text-slate-900 dark:hover:text-white'
					}`}
				>
					<ClipboardList className="w-4 h-4" />
					Análise
					{pendingCount > 0 ? (
						<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
							{pendingCount}
						</span>
					) : null}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('line-types')}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
						activeTab === 'line-types'
							? 'text-violet-600 dark:text-violet-400 border-violet-500'
							: 'text-slate-600 dark:text-gray-400 border-transparent hover:text-slate-900 dark:hover:text-white'
					}`}
				>
					<ImgIcon className="w-4 h-4" />
					Tipos de Linha
				</button>
			</div>

			{activeTab === 'line-types' && <LaserLineTypesAdminSection />}

			{activeTab === 'review' && (
				<div>
					<p className="mb-4 text-sm text-slate-500 dark:text-gray-400">
						Submissões enviadas pelos membros aguardando análise. Ao aprovar, o
						parâmetro entra na comunidade; ao rejeitar, informe o motivo.
					</p>
					{pendingLoading ? (
						<div className="flex justify-center py-20">
							<Loader2 className="w-8 h-8 animate-spin text-violet-500" />
						</div>
					) : pending.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
							<ClipboardList className="w-12 h-12 mb-3" />
							<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
								Nenhuma submissão pendente
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
							{pending.map((p) => (
								<div key={p.id} className="flex flex-col gap-2">
									<ParameterGridCard parameter={p} />
									<div className="flex items-center justify-end gap-2">
										<button
											type="button"
											onClick={() => setRejectTarget(p)}
											disabled={reviewMutation.isPending}
											className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
										>
											<X className="h-4 w-4" />
											Rejeitar
										</button>
										<button
											type="button"
											onClick={() =>
												reviewMutation.mutate({
													id: p.id,
													body: { action: 'approve' },
												})
											}
											disabled={reviewMutation.isPending}
											className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
										>
											<Check className="h-4 w-4" />
											Aprovar
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{activeTab === 'parameters' && (
				<>
					{/* Stats */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						{STATS_CONFIG.map((s) => {
							const value = statsData ? statsData[s.key] : '\u2014';
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
							{machineCatalog.map((m) => (
								<option key={m.id} value={m.name}>
									{m.name}
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
							<option value="Preenchimento">Preenchimento</option>
							<option value="Limpeza">Limpeza</option>
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

					{/* Seleção em lote: aplica categoria a vários parâmetros de uma vez */}
					{selectedIds.size > 0 ? (
						<div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-500/30 dark:bg-violet-500/10">
							<span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
								{selectedIds.size} selecionado(s)
							</span>
							<select
								value={bulkCategory}
								onChange={(e) => setBulkCategory(e.target.value)}
								className={selectCls}
							>
								<option value="">Escolher categoria…</option>
								{CATEGORY_OPTIONS.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={applyBulkCategory}
								disabled={!bulkCategory || bulkPending}
								className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
							>
								{bulkPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Check className="h-4 w-4" />
								)}
								Aplicar categoria
							</button>
							<button
								type="button"
								onClick={() => setSelectedIds(new Set())}
								className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
							>
								Limpar seleção
							</button>
						</div>
					) : null}

					{/* Cards (mesmo visual do cliente, com seleção + editar/excluir) */}
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
						<div className="mb-4">
							<div className="mb-3 flex items-center gap-3">
								<button
									type="button"
									onClick={() =>
										toggleSelectAllOnPage(
											parameters.map((p) => p.id),
											pageAllSelected,
										)
									}
									className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400"
								>
									<Check className="h-4 w-4" />
									{pageAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
								</button>
								<span className="text-xs text-slate-400">
									{parameters.length} nesta página
								</span>
							</div>
							<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
								{parameters.map((p) => (
									<ParameterGridCard
										key={p.id}
										parameter={p}
										selected={selectedIds.has(p.id)}
										onToggleSelect={() => toggleSelect(p.id)}
										onEdit={() => setEditTarget(p)}
										onDelete={() => setDeleteTarget(p)}
									/>
								))}
							</div>
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
				</>
			)}

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
					editId={editTarget.id}
					initial={{
						machine: editTarget.machine ?? '',
						powerWatts: editTarget.powerWatts ?? 0,
						lens: editTarget.lens ?? '',
						software: editTarget.software ?? '',
						material: editTarget.material,
						mode: editTarget.mode,
						speed: editTarget.speed,
						power: editTarget.power,
						frequency: editTarget.frequency,
						line: editTarget.line ?? 0,
						crossHatch: editTarget.crossHatch ?? false,
						angle: editTarget.angle ?? 0,
						passes: editTarget.passes,
						passesFill: editTarget.passesFill ?? 1,
						gas: typeof editTarget.gas === 'boolean' ? editTarget.gas : false,
						isPublic: editTarget.isPublic,
						notes: editTarget.notes ?? '',
						defocus: editTarget.defocus ?? undefined,
						materialType: editTarget.materialType ?? '',
						thickness: editTarget.thickness ?? '',
						tamanhoLinha: editTarget.tamanhoLinha ?? null,
						tamanhoDivisao: editTarget.tamanhoDivisao ?? null,
						sobreposicao: editTarget.sobreposicao ?? null,
						forcarSeparacao: editTarget.forcarSeparacao ?? null,
						axisRotative: editTarget.axisRotative ?? null,
						lineTypeId: editTarget.lineTypeId ?? null,
						imageUrl: editTarget.imageUrl ?? null,
						category: editTarget.category ?? null,
						color: editTarget.color ?? null,
						qPulse: editTarget.qPulse ?? null,
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

			{rejectTarget && (
				<RejectSubmissionModal
					parameter={rejectTarget}
					isPending={reviewMutation.isPending}
					onClose={() => setRejectTarget(null)}
					onConfirm={(reviewNote) => {
						reviewMutation.mutate(
							{ id: rejectTarget.id, body: { action: 'reject', reviewNote } },
							{ onSuccess: () => setRejectTarget(null) },
						);
					}}
				/>
			)}
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  Form Modal (create + edit) — usa o <ParameterForm> compartilhado   */
/* ------------------------------------------------------------------ */

function ParameterFormModal({
	title,
	initial,
	isPending,
	editId,
	onClose,
	onSubmit,
}: {
	title: string;
	initial: CreateParameterPayload;
	isPending: boolean;
	editId?: string;
	onClose: () => void;
	onSubmit: (payload: CreateParameterPayload) => void;
}) {
	// Ao editar um parametro multi-passada, carrega as passadas extras (2..N) e
	// injeta no `initial` do form compartilhado. Espera as passadas chegarem
	// antes de montar o form (evita o reset do efeito de `initial`).
	const { data: passesData, isLoading: passesLoading } = useParameterPasses(
		editId ?? null,
		!!editId,
	);

	const initialWithPasses = useMemo<CreateParameterPayload>(() => {
		if (!editId) return initial;
		const extras = (passesData?.passes ?? [])
			.filter((p) => (p.passOrder ?? 1) >= 2)
			.sort((a, b) => (a.passOrder ?? 0) - (b.passOrder ?? 0))
			.map(
				(p): PassRecipe => ({
					speed: p.speed,
					power: p.power,
					frequency: p.frequency,
					line: p.line ?? 0,
					crossHatch: p.crossHatch ?? false,
					angle: p.angle ?? 0,
					passes: p.passes,
					passesFill: p.passesFill ?? 1,
					defocus: p.defocus ?? null,
					gas: typeof p.gas === 'boolean' ? p.gas : false,
					notes: p.notes ?? '',
				}),
			);
		return extras.length ? { ...initial, extraPasses: extras } : initial;
	}, [editId, initial, passesData]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl p-6">
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

				{editId && passesLoading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="h-8 w-8 animate-spin text-violet-500" />
					</div>
				) : (
					<ParameterForm
						mode="admin"
						initial={initialWithPasses}
						submitting={isPending}
						onSubmit={onSubmit}
						onCancel={onClose}
						submitLabel="Salvar"
					/>
				)}
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
						{parameter.material} — {parameter.machine ?? parameter.mode}
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

/* ------------------------------------------------------------------ */
/*  Reject Submission Modal (motivo da rejeição)                       */
/* ------------------------------------------------------------------ */

function RejectSubmissionModal({
	parameter,
	isPending,
	onClose,
	onConfirm,
}: {
	parameter: LaserParameter;
	isPending: boolean;
	onClose: () => void;
	onConfirm: (reviewNote?: string) => void;
}) {
	const [note, setNote] = useState('');
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="relative w-full max-w-md mx-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Rejeitar submissão
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
					Rejeitar o parâmetro{' '}
					<span className="font-semibold text-slate-900 dark:text-white">
						{parameter.material} — {parameter.machine ?? parameter.mode}
					</span>
					. Informe o motivo (o membro verá em "Minhas submissões").
				</p>

				<textarea
					rows={3}
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder="Motivo da rejeição (opcional)"
					className="mb-6 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
				/>

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
						onClick={() => onConfirm(note.trim() || undefined)}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
					>
						{isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						Rejeitar
					</button>
				</div>
			</div>
		</div>
	);
}
