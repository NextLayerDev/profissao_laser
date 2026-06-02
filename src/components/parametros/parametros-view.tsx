'use client';

import {
	Award,
	Clock,
	Cpu,
	Filter,
	Flame,
	type LucideIcon,
	Search,
	Star,
	Table,
	ThumbsUp,
	Users,
	X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ParameterDetailModal } from '@/components/parametros/parameter-detail-modal';
import { ParameterGridCard } from '@/components/parametros/parameter-grid-card';
import { PageHeader } from '@/components/ui/page-header';
import { ParameterGridSkeleton } from '@/components/ui/skeletons/parameter-grid-skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
	useCommunityParameters,
	useLikeParameter,
	useParameterOptions,
	useParameterSidebar,
	useParameterStats,
	useRateParameter,
	useSaveParameter,
} from '@/hooks/use-parameters';
import {
	MACHINE_OPTIONS,
	MATERIAL_OPTIONS,
} from '@/utils/constants/parameter-options';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const STATS_CONFIG = [
	{ key: 'totalParameters' as const, label: 'Parâmetros', icon: Table },
	{ key: 'totalMaterials' as const, label: 'Materiais', icon: Flame },
	{ key: 'totalMachines' as const, label: 'Máquinas', icon: Cpu },
	{ key: 'totalContributors' as const, label: 'Contribuidores', icon: Users },
];

const SORT_CHIPS = [
	{ value: 'likes' as const, label: 'Mais usados', icon: ThumbsUp },
	{ value: 'rating' as const, label: 'Melhor avaliados', icon: Star },
];

type SortValue = (typeof SORT_CHIPS)[number]['value'];

/** Filtros do painel "Filtros" — segurados em estado local até "Buscar". */
interface StagedFilters {
	machine: string;
	lens: string;
	mode: string;
	category: string;
	color: string;
	material: string;
}

const EMPTY_FILTERS: StagedFilters = {
	machine: '',
	lens: '',
	mode: '',
	category: '',
	color: '',
	material: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ParametrosView() {
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebouncedValue(search, 400);
	const [sort, setSort] = useState<SortValue>('likes');
	const [page, setPage] = useState(1);
	const [detailId, setDetailId] = useState<string | null>(null);
	const limit = 12;

	// Filtros do painel: "staged" enquanto o usuário mexe, "applied" só ao Buscar.
	const [staged, setStaged] = useState<StagedFilters>(EMPTY_FILTERS);
	const [applied, setApplied] = useState<StagedFilters>(EMPTY_FILTERS);

	const { data: stats } = useParameterStats();
	const { data: sidebar } = useParameterSidebar();

	// Vocabulário (dropdowns 2/3/4/5) — Máquina/Material vêm de constantes.
	const { data: lensOptions = [] } = useParameterOptions('lens');
	const { data: modeOptions = [] } = useParameterOptions('mode');
	const { data: categoryOptions = [] } = useParameterOptions('category');
	const { data: colorOptions = [] } = useParameterOptions('color');

	const stagedActiveCount = useMemo(
		() => Object.values(staged).filter(Boolean).length,
		[staged],
	);

	const queryParams = useMemo(
		() => ({
			page,
			limit,
			sort,
			search: debouncedSearch.trim() || undefined,
			machine: applied.machine || undefined,
			lens: applied.lens || undefined,
			mode: applied.mode || undefined,
			category: applied.category || undefined,
			color: applied.color || undefined,
			material: applied.material || undefined,
		}),
		[page, sort, debouncedSearch, applied],
	);
	const { data, isLoading } = useCommunityParameters(queryParams);
	const parameters = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const likeMut = useLikeParameter();
	const saveMut = useSaveParameter();
	const rateMut = useRateParameter();

	const pickSort = (v: SortValue) => {
		setSort(v);
		setPage(1);
	};
	const setStagedField = (field: keyof StagedFilters, value: string) =>
		setStaged((prev) => ({ ...prev, [field]: value }));
	const applyFilters = () => {
		setApplied(staged);
		setPage(1);
	};
	const clearFilters = () => {
		setStaged(EMPTY_FILTERS);
		setApplied(EMPTY_FILTERS);
		setPage(1);
	};

	return (
		<div className="relative">
			<PageHeader
				title="Parâmetros"
				subtitle="Receitas testadas e aprovadas pela comunidade para resultados perfeitos."
				icon={Table}
			/>

			{/* Stats */}
			<div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
				{STATS_CONFIG.map((s) => (
					<div
						key={s.label}
						className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1d]"
					>
						<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
							<s.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						</div>
						<p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
							{stats ? stats[s.key].toLocaleString('pt-BR') : '—'}
						</p>
						<p className="text-sm text-slate-500 dark:text-gray-400">
							{s.label}
						</p>
					</div>
				))}
			</div>

			{/* Busca */}
			<div className="relative mb-4">
				<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					placeholder="Buscar por material, máquina, modo, palavra-chave..."
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					className="h-12 w-full rounded-full border border-slate-200 bg-slate-100 pl-12 pr-4 text-slate-900 placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
				/>
			</div>

			{/* Painel de Filtros (staged → aplica no "Buscar") */}
			<div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1d]">
				<div className="mb-3 flex items-center gap-2">
					<Filter className="h-4 w-4 text-violet-500" />
					<h3 className="text-sm font-bold text-slate-900 dark:text-white">
						Filtros
					</h3>
				</div>

				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
					<FilterSelect
						n={1}
						label="Máquina"
						value={staged.machine}
						onChange={(v) => setStagedField('machine', v)}
						options={MACHINE_OPTIONS}
					/>
					<FilterSelect
						n={2}
						label="Lente"
						value={staged.lens}
						onChange={(v) => setStagedField('lens', v)}
						options={lensOptions.map((o) => o.value)}
					/>
					<FilterSelect
						n={3}
						label="Tipo"
						value={staged.mode}
						onChange={(v) => setStagedField('mode', v)}
						options={modeOptions.map((o) => o.value)}
					/>
					<FilterSelect
						n={4}
						label="Categoria"
						value={staged.category}
						onChange={(v) => setStagedField('category', v)}
						options={categoryOptions.map((o) => o.value)}
					/>
					<FilterSelect
						n={5}
						label="Cor"
						value={staged.color}
						onChange={(v) => setStagedField('color', v)}
						options={colorOptions.map((o) => o.value)}
					/>
					<FilterSelect
						n={6}
						label="Material"
						value={staged.material}
						onChange={(v) => setStagedField('material', v)}
						options={MATERIAL_OPTIONS}
					/>
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
					<button
						type="button"
						onClick={clearFilters}
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
					>
						<X className="h-4 w-4" />
						Limpar filtros
					</button>
					<div className="flex items-center gap-3">
						<span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
							Filtros ativos
							<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-bold text-white">
								{stagedActiveCount}
							</span>
						</span>
						<button
							type="button"
							onClick={applyFilters}
							className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
						>
							<Search className="h-4 w-4" />
							Buscar
						</button>
					</div>
				</div>
			</div>

			{/* Ordenação (chips) */}
			<div className="mb-6 flex flex-wrap items-center gap-2">
				{SORT_CHIPS.map((c) => (
					<button
						key={c.value}
						type="button"
						onClick={() => pickSort(c.value)}
						className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
							sort === c.value
								? 'bg-violet-600 text-white'
								: 'border border-slate-200 bg-white text-slate-600 hover:border-violet-400 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-gray-300'
						}`}
					>
						<c.icon className="h-4 w-4" />
						{c.label}
					</button>
				))}
			</div>

			{/* Grid + sidebar */}
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
				{/* Cards */}
				<div>
					{isLoading ? (
						<ParameterGridSkeleton />
					) : parameters.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-gray-500">
							<Table className="mb-3 h-12 w-12 opacity-40" />
							<p className="text-sm font-medium">Nenhum parâmetro encontrado</p>
							<p className="mt-1 text-xs text-slate-400">
								Tente ajustar a busca ou os filtros.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{parameters.map((p) => (
								<ParameterGridCard
									key={p.id}
									parameter={p}
									onLike={() => likeMut.mutate(p.id)}
									onSave={() =>
										saveMut.mutate({ id: p.id, saved: !!p.isSaved })
									}
									onRate={(n) => rateMut.mutate({ id: p.id, rating: n })}
									onViewDetails={() => setDetailId(p.id)}
								/>
							))}
						</div>
					)}

					{totalPages > 1 ? (
						<div className="mt-6 flex items-center justify-center gap-2">
							<button
								type="button"
								disabled={page === 1}
								onClick={() => setPage((p) => p - 1)}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40 dark:border-white/10 dark:text-gray-300"
							>
								Anterior
							</button>
							<span className="px-2 text-sm text-slate-500 dark:text-gray-400">
								{page} / {totalPages}
							</span>
							<button
								type="button"
								disabled={page === totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40 dark:border-white/10 dark:text-gray-300"
							>
								Próximo
							</button>
						</div>
					) : null}
				</div>

				{/* Sidebar */}
				<aside className="space-y-5">
					<SidebarCard title="Top Contribuidores" icon={Award}>
						{sidebar?.topContributors.length ? (
							sidebar.topContributors.map((c, i) => (
								<div
									key={c.createdBy}
									className="flex items-center justify-between gap-2 py-1.5"
								>
									<span className="truncate text-sm text-slate-700 dark:text-gray-300">
										<span className="mr-1.5 font-bold text-violet-500">
											{i + 1}
										</span>
										{c.name ?? 'Anônimo'}
									</span>
									<span className="text-xs font-semibold text-slate-400">
										{c.count}
									</span>
								</div>
							))
						) : (
							<Empty />
						)}
					</SidebarCard>

					<SidebarCard title="Atividade recente" icon={Clock}>
						{sidebar?.recentActivity.length ? (
							sidebar.recentActivity.map((a) => (
								<div key={a.id} className="py-1.5">
									<p className="truncate text-sm text-slate-700 dark:text-gray-300">
										{a.material}
									</p>
									<p className="text-xs text-slate-400">
										por {a.createdByName ?? 'Anônimo'}
									</p>
								</div>
							))
						) : (
							<Empty />
						)}
					</SidebarCard>

					<SidebarCard title="Mais usados da semana" icon={Flame}>
						{sidebar?.mostUsed.length ? (
							sidebar.mostUsed.map((m) => (
								<button
									key={m.id}
									type="button"
									onClick={() => setDetailId(m.id)}
									className="flex w-full items-center justify-between gap-2 py-1.5 text-left hover:text-violet-500"
								>
									<span className="truncate text-sm text-slate-700 dark:text-gray-300">
										{m.material}
									</span>
									<span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
										<ThumbsUp className="h-3 w-3" />
										{m.likesCount}
									</span>
								</button>
							))
						) : (
							<Empty />
						)}
					</SidebarCard>
				</aside>
			</div>

			<ParameterDetailModal
				parameterId={detailId}
				onClose={() => setDetailId(null)}
			/>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Filtro: dropdown numerado                                          */
/* ------------------------------------------------------------------ */

function FilterSelect({
	n,
	label,
	value,
	onChange,
	options,
}: {
	n: number;
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
}) {
	return (
		<div>
			<div className="mb-1.5 flex items-center gap-1.5">
				<span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
					{n}
				</span>
				<span className="text-xs font-medium text-slate-600 dark:text-gray-300">
					{label}
				</span>
			</div>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white"
			>
				<option value="">Selecione</option>
				{options.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Sidebar helpers                                                    */
/* ------------------------------------------------------------------ */

function SidebarCard({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1d]">
			<h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
				<Icon className="h-4 w-4 text-violet-500" />
				{title}
			</h3>
			<div className="divide-y divide-slate-100 dark:divide-white/5">
				{children}
			</div>
		</div>
	);
}

function Empty() {
	return <p className="py-2 text-xs text-slate-400">Sem dados ainda.</p>;
}
