'use client';

import {
	ArrowLeftRight,
	Bookmark,
	BookOpen,
	Calculator,
	Cpu,
	Download,
	Filter,
	Focus,
	Layers,
	Lightbulb,
	Loader2,
	Search,
	Star,
	Table,
	TestTube,
	ThumbsUp,
	Users,
	Wrench,
	X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import {
	useCommunityParameters,
	useExportParameters,
	useLikeParameter,
	useParameterMachines,
	useParameterMaterials,
	useParameterStats,
	useParameters,
	useRateParameter,
	useSaveParameter,
} from '@/hooks/use-parameters';
import type { LaserParameter } from '@/types/parameters';

/* ------------------------------------------------------------------ */
/*  Quick access config                                                */
/* ------------------------------------------------------------------ */

const QUICK_ACCESS_ITEMS = [
	{ icon: BookOpen, label: 'Guia de materiais' },
	{ icon: TestTube, label: 'Testar parametros' },
	{ icon: Focus, label: 'Foco na maquina' },
	{ icon: Wrench, label: 'Manutencao' },
	{ icon: ArrowLeftRight, label: 'Conversor de unidades' },
	{ icon: Calculator, label: 'Calculadora de custo' },
];

const STATS_CONFIG = [
	{
		key: 'totalParameters' as const,
		label: 'Tabelas',
		icon: Table,
	},
	{
		key: 'totalMachines' as const,
		label: 'Maquinas',
		icon: Cpu,
	},
	{
		key: 'totalMaterials' as const,
		label: 'Materiais',
		icon: Layers,
	},
	{
		key: 'totalContributors' as const,
		label: 'Contribuidores',
		icon: Users,
	},
];

const COMMUNITY_SORT_OPTIONS = [
	{ value: 'recent' as const, label: 'Recentes' },
	{ value: 'rating' as const, label: 'Melhor avaliados' },
	{ value: 'likes' as const, label: 'Mais curtidos' },
];

/* ------------------------------------------------------------------ */
/*  Material emoji mapping                                             */
/* ------------------------------------------------------------------ */

function getMaterialEmoji(
	material: string,
	materialType?: string | null,
): string {
	const text = `${material} ${materialType ?? ''}`.toLowerCase();
	if (text.match(/madeira|mdf|compensado|wood|balsa|cedro|pinus/))
		return '\u{1FAB5}';
	if (text.match(/acril|acryl|plexiglass|pmma/)) return '\u{1F48E}';
	if (text.match(/couro|leather|napa/)) return '\u{1F45C}';
	if (text.match(/tecido|feltro|fabric|pano|jeans|algodao|nylon/))
		return '\u{1F9F5}';
	if (text.match(/papel|papelao|card|carton|kraft/)) return '\u{1F4C4}';
	if (text.match(/borracha|rubber|eva|silicone/)) return '\u{1F6AA}';
	if (text.match(/vidro|glass|espelho|mirror/)) return '\u{1FAA9}';
	if (
		text.match(
			/metal|aco|alumin|ferro|inox|steel|iron|cobre|latao|brass|titanio/,
		)
	)
		return '\u{2699}\u{FE0F}';
	if (text.match(/pedra|marmore|granito|stone|ceramica|ceramic|porcelana/))
		return '\u{1FAA8}';
	if (text.match(/plastico|plastic|pvc|abs|pet|polietileno|polipropileno/))
		return '\u{267B}\u{FE0F}';
	if (text.match(/espuma|foam|isopor|eps/)) return '\u{1F9FC}';
	if (text.match(/cortica|cork/)) return '\u{1F377}';
	return '\u{1F525}';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ParametrosView() {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterMachine, setFilterMachine] = useState('');
	const [filterMaterial, setFilterMaterial] = useState('');
	const [filterThickness, setFilterThickness] = useState('');
	const limit = 12;

	/* community tab */
	const [communityPage, setCommunityPage] = useState(1);
	const [communitySearchQuery, setCommunitySearchQuery] = useState('');
	const [communitySort, setCommunitySort] = useState<
		'recent' | 'rating' | 'likes'
	>('rating');
	const communityLimit = 12;

	/* ---- hooks ---------------------------------------------------- */
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
		}),
		[currentPage, searchQuery, filterMachine, filterMaterial, filterThickness],
	);

	const { data: parametersData, isLoading: parametersLoading } =
		useParameters(queryParams);
	const parameters = parametersData?.data ?? [];
	const totalParameters = parametersData?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalParameters / limit));

	/* community */
	const communityQueryParams = useMemo(
		() => ({
			page: communityPage,
			limit: communityLimit,
			sort: communitySort,
			search: communitySearchQuery.trim() || undefined,
		}),
		[communityPage, communitySort, communitySearchQuery],
	);

	const { data: communityFullData, isLoading: communityLoading } =
		useCommunityParameters(communityQueryParams);
	const communityFullParams = communityFullData?.data ?? [];
	const communityTotal = communityFullData?.total ?? 0;
	const communityTotalPages = Math.max(
		1,
		Math.ceil(communityTotal / communityLimit),
	);

	const savedParams = useMemo(() => {
		const saved = new Map<string, LaserParameter>();
		for (const p of parameters) {
			if (p.isSaved) saved.set(p.id, p);
		}
		for (const p of communityFullParams) {
			if (p.isSaved && !saved.has(p.id)) saved.set(p.id, p);
		}
		return Array.from(saved.values());
	}, [parameters, communityFullParams]);

	const saveParameterMutation = useSaveParameter();
	const likeParameterMutation = useLikeParameter();
	const exportMutation = useExportParameters();
	const rateParameterMutation = useRateParameter();

	/* ---- unique thicknesses from materials ---- */
	const thicknesses = useMemo(() => {
		const set = new Set<string>();
		for (const m of materials) {
			m.commonThicknesses?.forEach((t) => {
				set.add(t);
			});
		}
		return Array.from(set).sort();
	}, [materials]);

	/* ---- handlers ------------------------------------------------- */
	const handleClearFilters = () => {
		setFilterMachine('');
		setFilterMaterial('');
		setFilterThickness('');
		setSearchQuery('');
		setCurrentPage(1);
	};

	const handleSearch = () => {
		setCurrentPage(1);
	};

	const handleSave = (p: LaserParameter) => {
		saveParameterMutation.mutate({ id: p.id, saved: !!p.isSaved });
	};

	const handleLike = (id: string) => {
		likeParameterMutation.mutate(id);
	};

	const handleExport = () => {
		exportMutation.mutate(queryParams);
	};

	const handleRate = (id: string, rating: number) => {
		rateParameterMutation.mutate({ id, rating });
	};

	const comingSoon = () => toast.info('Em breve');

	/* ---- header --------------------------------------------------- */
	const header = (
		<PageHeader
			title="Parametros"
			subtitle="Tabelas de corte e gravacao para todas as maquinas."
			icon={Table}
		/>
	);

	/* ---- stat cards ------------------------------------------------ */
	const statsCards = (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			{STATS_CONFIG.map((s) => {
				const value = statsData ? statsData[s.key] : '—';
				return (
					<div
						key={s.label}
						className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5 hover:border-violet-500/30 transition-all duration-300"
					>
						<div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 mb-3">
							<s.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
						</div>
						<p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
							{typeof value === 'number'
								? value.toLocaleString('pt-BR')
								: value}
						</p>
						<p className="text-sm text-slate-500 dark:text-gray-400">
							{s.label}
						</p>
					</div>
				);
			})}
		</div>
	);

	/* ---- filter bar ------------------------------------------------ */
	const filterBar = (
		<div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
			<Filter className="w-4 h-4 text-slate-400" />

			<select
				className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-600"
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
				className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-600"
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
				className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-600"
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

			<div className="ml-auto flex items-center gap-2">
				<button
					type="button"
					onClick={handleClearFilters}
					className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
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
						onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
						className="pl-9 pr-4 py-2 w-40 md:w-52 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
					/>
				</div>
			</div>
		</div>
	);

	/* (tabs removed — all 3 sections shown at once) */

	/* ---- data table ------------------------------------------------ */
	function displayGas(gas: boolean | string | null | undefined): string {
		if (gas == null) return '\u2014';
		if (typeof gas === 'boolean') return gas ? 'Sim' : 'Nao';
		return gas || '\u2014';
	}

	const columns = [
		'Material',
		'Maquina',
		'Lente',
		'Modo',
		'Power%',
		'PowerW',
		'Velocidade',
		'Freq',
		'Line',
		'Passadas',
		'Gas',
		'Acao',
	];

	const dataTable = (
		<div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10 mb-4">
			{parametersLoading ? (
				<div className="animate-pulse">
					{/* Skeleton table header */}
					<div className="bg-slate-50 dark:bg-white/5 px-4 py-3 flex gap-4">
						{Array.from({ length: 9 }).map((_, i) => (
							<div
								key={i}
								className="h-4 w-20 rounded bg-slate-200 dark:bg-white/5"
							/>
						))}
					</div>
					{/* Skeleton table rows */}
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className={`flex items-center gap-4 px-4 py-3 border-t border-slate-100 dark:border-white/5 ${i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-white/5'}`}
						>
							<div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-14 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-20 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-12 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-14 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-10 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-12 rounded bg-slate-200 dark:bg-white/5" />
						</div>
					))}
				</div>
			) : parameters.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600">
					<Table className="w-12 h-12 mb-3 opacity-50" />
					<p className="text-sm font-medium">Nenhum parametro encontrado</p>
					<p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
						Tente ajustar os filtros ou adicione um novo parametro.
					</p>
				</div>
			) : (
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-slate-50 dark:bg-white/5">
							{columns.map((col) => (
								<th
									key={col}
									className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
								>
									{col}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{parameters.map((p, idx) => (
							<tr
								key={p.id}
								className={`border-t border-slate-100 dark:border-white/5 ${
									idx % 2 === 0
										? 'bg-white dark:bg-transparent'
										: 'bg-slate-50/50 dark:bg-white/5'
								} hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-colors`}
							>
								<td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
									{getMaterialEmoji(p.material, p.materialType)} {p.material}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.machine || '\u2014'}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.lens ?? '\u2014'}
								</td>
								<td className="px-4 py-3">
									<span
										className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
											p.mode === 'Corte'
												? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
												: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
										}`}
									>
										{p.mode}
									</span>
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.power}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.powerWatts ?? '\u2014'}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.speed}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.frequency}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.line ?? '\u2014'}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{p.passes}
								</td>
								<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
									{displayGas(p.gas)}
								</td>
								<td className="px-4 py-3">
									<button
										type="button"
										onClick={() => handleSave(p)}
										className={`text-xs font-medium hover:underline ${
											p.isSaved
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-violet-700 dark:text-violet-400'
										}`}
									>
										{p.isSaved ? 'Salvo' : 'Salvar'}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);

	/* ---- pagination ------------------------------------------------ */
	const showingFrom = totalParameters === 0 ? 0 : (currentPage - 1) * limit + 1;
	const showingTo = Math.min(currentPage * limit, totalParameters);

	const pagination = (
		<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-10">
			<p className="text-sm text-slate-500 dark:text-gray-400">
				Mostrando{' '}
				<span className="font-semibold text-slate-700 dark:text-slate-300">
					{showingFrom} a {showingTo}
				</span>{' '}
				de{' '}
				<span className="font-semibold text-slate-700 dark:text-slate-300">
					{totalParameters.toLocaleString('pt-BR')}
				</span>
			</p>

			<div className="flex items-center gap-3">
				{totalPages > 1 && (
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							disabled={currentPage === 1}
							onClick={() => setCurrentPage((p) => p - 1)}
							className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 dark:hover:border-violet-500/40 transition-colors"
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
											<span className="px-1 text-slate-400 dark:text-gray-500">
												...
											</span>
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
							className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 dark:hover:border-violet-500/40 transition-colors"
						>
							Proximo
						</button>
					</div>
				)}

				<button
					type="button"
					onClick={handleExport}
					disabled={exportMutation.isPending}
					className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1a1a1d] hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
				>
					{exportMutation.isPending ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Download className="w-4 h-4" />
					)}
					Exportar tabela
				</button>
			</div>
		</div>
	);

	/* ---- saved sidebar -------------------------------------------- */
	const savedSidebar = (
		<div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5">
			<div className="space-y-3">
				{savedParams.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-gray-500">
						<Bookmark className="w-10 h-10 mb-2 opacity-40" />
						<p className="text-sm font-medium">Nenhum salvo</p>
						<p className="text-xs mt-1 text-center">
							Salve parametros da tabela ou comunidade.
						</p>
					</div>
				) : (
					savedParams.map((s) => (
						<div
							key={s.id}
							className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 group"
						>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
									{getMaterialEmoji(s.material, s.materialType)} {s.material} -{' '}
									{s.thickness}
								</p>
								<div className="flex items-center gap-2 mt-1">
									<span
										className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
											s.mode === 'Corte'
												? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
												: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
										}`}
									>
										{s.mode}
									</span>
									<span className="text-[10px] text-slate-400 dark:text-gray-500">
										{s.power}% &middot; {s.speed}mm/s
									</span>
								</div>
							</div>
							<button
								type="button"
								onClick={() => handleSave(s)}
								className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
								title="Remover"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);

	/* ---- community content ---------------------------------------- */
	const communityContent = (
		<div className="lg:max-h-[640px] overflow-y-auto lg:pr-2">
			{communityLoading ? (
				<div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5"
						>
							<div className="flex items-center gap-3 mb-4">
								<div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/5" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/5" />
									<div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/5" />
								</div>
								<div className="h-6 w-14 rounded-full bg-slate-200 dark:bg-white/5" />
							</div>
							<div className="rounded-xl bg-slate-50/80 dark:bg-white/5 p-3 space-y-2">
								<div className="h-3 w-full rounded bg-slate-200 dark:bg-white/5" />
								<div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-white/5" />
							</div>
							<div className="mt-4 flex items-center justify-between">
								<div className="flex gap-1">
									{Array.from({ length: 5 }).map((_, j) => (
										<div
											key={j}
											className="w-4 h-4 rounded bg-slate-200 dark:bg-white/5"
										/>
									))}
								</div>
								<div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/5" />
							</div>
						</div>
					))}
				</div>
			) : communityFullParams.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600">
					<Users className="w-12 h-12 mb-3 opacity-50" />
					<p className="text-sm font-medium">Nenhum parametro da comunidade</p>
					<p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
						Seja o primeiro a compartilhar um parametro!
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{communityFullParams.map((c) => {
						const isCorte = c.mode === 'Corte';
						return (
							<div
								key={c.id}
								className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden hover:border-violet-500/30 transition-all duration-300 group"
							>
								{/* Header with emoji avatar */}
								<div className="p-5 pb-0">
									<div className="flex items-center gap-3 mb-4">
										<div
											className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
												isCorte
													? 'bg-blue-50 dark:bg-blue-500/10'
													: 'bg-violet-50 dark:bg-violet-500/10'
											}`}
										>
											{getMaterialEmoji(c.material, c.materialType)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-slate-900 dark:text-white truncate">
												{c.material}
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-400">
												{c.thickness} &middot; {c.materialType}
											</p>
										</div>
										<span
											className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
												isCorte
													? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
													: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
											}`}
										>
											{c.mode}
										</span>
									</div>
								</div>

								{/* Parameter details grid */}
								<div className="mx-5 mb-4 rounded-xl bg-slate-50/80 dark:bg-white/5 p-3">
									<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-slate-400 dark:text-gray-500">
												Potencia
											</span>
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												{c.power}%
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400 dark:text-gray-500">
												Velocidade
											</span>
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												{c.speed}mm/s
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400 dark:text-gray-500">
												Frequencia
											</span>
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												{c.frequency}Hz
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400 dark:text-gray-500">
												Passadas
											</span>
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												{c.passes}
											</span>
										</div>
										{c.powerWatts != null && (
											<div className="flex justify-between">
												<span className="text-slate-400 dark:text-gray-500">
													PowerW
												</span>
												<span className="font-semibold text-slate-800 dark:text-slate-200">
													{c.powerWatts}W
												</span>
											</div>
										)}
										{c.lens && (
											<div className="flex justify-between">
												<span className="text-slate-400 dark:text-gray-500">
													Lente
												</span>
												<span className="font-semibold text-slate-800 dark:text-slate-200">
													{c.lens}
												</span>
											</div>
										)}
										{c.software && (
											<div className="flex justify-between">
												<span className="text-slate-400 dark:text-gray-500">
													Software
												</span>
												<span className="font-semibold text-slate-800 dark:text-slate-200 truncate ml-2">
													{c.software}
												</span>
											</div>
										)}
										{c.line != null && (
											<div className="flex justify-between">
												<span className="text-slate-400 dark:text-gray-500">
													Line
												</span>
												<span className="font-semibold text-slate-800 dark:text-slate-200">
													{c.line}
												</span>
											</div>
										)}
										{c.gas != null && (
											<div className="flex justify-between">
												<span className="text-slate-400 dark:text-gray-500">
													Gas
												</span>
												<span className="font-semibold text-slate-800 dark:text-slate-200">
													{displayGas(c.gas)}
												</span>
											</div>
										)}
										{c.machine && (
											<div className="flex justify-between">
												<span className="text-slate-400 dark:text-gray-500">
													Maquina
												</span>
												<span className="font-semibold text-slate-800 dark:text-slate-200 truncate ml-2">
													{c.machine}
												</span>
											</div>
										)}
									</div>
								</div>

								{/* Creator + notes */}
								<div className="px-5 pb-4">
									<p className="text-xs text-slate-500 dark:text-gray-400">
										por{' '}
										<span className="font-medium text-slate-700 dark:text-slate-300">
											{c.createdByName ?? 'Anonimo'}
										</span>
									</p>

									{c.notes && (
										<div className="mt-2 pl-3 border-l-2 border-violet-300 dark:border-violet-500/40">
											<p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
												{c.notes}
											</p>
										</div>
									)}
								</div>

								{/* Social actions footer */}
								<div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
									{/* Rating stars (clickable) */}
									<div className="flex items-center gap-0.5">
										{Array.from({ length: 5 }).map((_, i) => (
											<button
												key={`star-${i}`}
												type="button"
												onClick={() => handleRate(c.id, i + 1)}
												className="p-0.5 hover:scale-125 transition-transform"
												title={`Avaliar ${i + 1} estrela${i > 0 ? 's' : ''}`}
											>
												<Star
													className={`w-4 h-4 ${
														i < (c.userRating ?? 0)
															? 'text-violet-400 fill-violet-400'
															: i < (c.rating ?? 0)
																? 'text-violet-300 fill-violet-300/50'
																: 'text-slate-300 dark:text-slate-600'
													}`}
												/>
											</button>
										))}
										{c.rating != null && (
											<span className="ml-1 text-xs font-medium text-slate-500 dark:text-gray-400">
												{c.rating.toFixed(1)}
											</span>
										)}
									</div>

									{/* Like + Save */}
									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={() => handleLike(c.id)}
											className={`flex items-center gap-1 text-xs font-medium hover:text-violet-600 transition-colors ${
												c.isLiked
													? 'text-violet-600'
													: 'text-slate-500 dark:text-gray-400'
											}`}
										>
											<ThumbsUp
												className={`w-3.5 h-3.5 ${c.isLiked ? 'fill-current' : ''}`}
											/>
											{c.likesCount ?? 0}
										</button>
										<button
											type="button"
											onClick={() => handleSave(c)}
											className={`flex items-center gap-1 text-xs font-medium hover:text-emerald-500 transition-colors ${
												c.isSaved
													? 'text-emerald-500'
													: 'text-slate-500 dark:text-gray-400'
											}`}
										>
											<Bookmark
												className={`w-3.5 h-3.5 ${c.isSaved ? 'fill-current' : ''}`}
											/>
											{c.isSaved ? 'Salvo' : 'Salvar'}
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Community pagination */}
			{communityTotalPages > 1 && (
				<div className="flex items-center justify-center gap-1.5 mt-6">
					<button
						type="button"
						disabled={communityPage === 1}
						onClick={() => setCommunityPage((p) => p - 1)}
						className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 dark:hover:border-violet-500/40 transition-colors"
					>
						Anterior
					</button>

					{Array.from({ length: communityTotalPages }, (_, i) => i + 1)
						.filter((page) => {
							if (communityTotalPages <= 7) return true;
							if (page === 1 || page === communityTotalPages) return true;
							return Math.abs(page - communityPage) <= 1;
						})
						.map((page, idx, arr) => {
							const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
							return (
								<span key={page} className="flex items-center">
									{showEllipsis && (
										<span className="px-1 text-slate-400 dark:text-gray-500">
											...
										</span>
									)}
									<button
										type="button"
										onClick={() => setCommunityPage(page)}
										className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
											page === communityPage
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
						disabled={communityPage === communityTotalPages}
						onClick={() => setCommunityPage((p) => p + 1)}
						className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 dark:hover:border-violet-500/40 transition-colors"
					>
						Proximo
					</button>
				</div>
			)}
		</div>
	);

	/* ---- expert tip card ------------------------------------------ */
	const expertTip = (
		<div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-violet-50 to-violet-50 dark:from-violet-500/10 dark:to-violet-500/10 p-6 mb-10">
			<div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
			<div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-violet-200/50 dark:bg-violet-500/10 blur-2xl" />

			<div className="relative flex flex-col md:flex-row items-start gap-6">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-3">
						<Lightbulb className="w-5 h-5 text-violet-700 dark:text-violet-400" />
						<h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
							Dica do especialista
						</h3>
					</div>
					<p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
						Ao cortar materiais mais espessos, reduza a velocidade e aumente o
						numero de passadas em vez de aumentar a potencia ao maximo. Isso
						preserva a vida util do tubo laser e produz bordas mais limpas. Para
						acrilico, sempre use gas nitrogenio (N2) para obter aquele
						acabamento polido nas bordas de corte.
					</p>
				</div>
			</div>
		</div>
	);

	/* ---- quick access --------------------------------------------- */
	const quickAccess = (
		<div>
			<h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">
				Acesse rapido
			</h2>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
				{QUICK_ACCESS_ITEMS.map((item) => (
					<button
						key={item.label}
						type="button"
						onClick={comingSoon}
						className="flex flex-col items-center gap-3 p-5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-300 group"
					>
						<div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20 transition-colors">
							<item.icon className="w-5 h-5 text-slate-500 dark:text-gray-400 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors" />
						</div>
						<span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center leading-tight">
							{item.label}
						</span>
					</button>
				))}
			</div>
		</div>
	);

	/* ---- render --------------------------------------------------- */
	return (
		<div className="relative">
			{header}
			{statsCards}

			{/* Section 1: Tabela de parametros */}
			<div className="mb-10">
				<h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
					<Table className="w-5 h-5 text-violet-600" />
					Tabela de parametros
				</h2>
				{filterBar}
				{dataTable}
				{pagination}
			</div>

			{/* Section 2: Comunidade + Salvos side by side */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
				{/* Comunidade — 2/3 */}
				<div className="lg:col-span-2">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
							<Users className="w-5 h-5 text-violet-600" />
							Comunidade
						</h2>
						<select
							className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-600"
							value={communitySort}
							onChange={(e) => {
								setCommunitySort(
									e.target.value as 'recent' | 'rating' | 'likes',
								);
								setCommunityPage(1);
							}}
						>
							{COMMUNITY_SORT_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>

					{/* Pesquisa inteligente — busca server-side via API
					    em material, materialType, máquina, modo, etc. */}
					<div className="relative mb-4">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
						<input
							type="text"
							placeholder="Buscar por material, máquina, modo, espessura..."
							value={communitySearchQuery}
							onChange={(e) => {
								setCommunitySearchQuery(e.target.value);
								setCommunityPage(1);
							}}
							className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-600/40"
						/>
						{communitySearchQuery ? (
							<button
								type="button"
								onClick={() => {
									setCommunitySearchQuery('');
									setCommunityPage(1);
								}}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
								aria-label="Limpar busca"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						) : null}
					</div>

					{communityContent}
				</div>

				{/* Salvos — 1/3 */}
				<div>
					<h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
						<Bookmark className="w-5 h-5 text-violet-600" />
						Meus salvos
					</h2>
					{savedSidebar}
				</div>
			</div>

			{expertTip}
			{quickAccess}
		</div>
	);
}
