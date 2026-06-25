'use client';

import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	BarChart3,
	Coins,
	Loader2,
	PieChart as PieIcon,
	RefreshCw,
	RotateCcw,
	Search,
	TrendingUp,
	Users,
	Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { useToolUsage } from '@/modules/analytics/hooks/use-analytics';
import type {
	ToolUsageGroup,
	ToolUsageParams,
	ToolUsageRow,
	ToolUsageStatus,
} from '@/modules/analytics/types/analytics';
import { formatCurrency } from '@/utils/format-currency';

/* ──────────────────────────────────────────────────────────────────────── */
/*  Filtros: presets de data + granularidade + status                        */
/* ──────────────────────────────────────────────────────────────────────── */

type DatePreset = '7d' | '30d' | '90d' | 'month' | 'custom';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
	{ value: '7d', label: '7 dias' },
	{ value: '30d', label: '30 dias' },
	{ value: '90d', label: '90 dias' },
	{ value: 'month', label: 'Mês' },
	{ value: 'custom', label: 'Personalizado' },
];

const STATUS_OPTIONS: { value: ToolUsageStatus; label: string }[] = [
	{ value: 'succeeded', label: 'Concluídos' },
	{ value: 'all', label: 'Todos' },
	{ value: 'refunded', label: 'Reembolsados' },
];

function getRange(preset: DatePreset, customFrom: string, customTo: string) {
	if (preset === 'custom')
		// inputs <type=date> dão 'YYYY-MM-DD'; o backend exige ISO completo
		// (z.iso.datetime) — converte cobrindo o dia inteiro.
		return {
			from: customFrom
				? new Date(`${customFrom}T00:00:00`).toISOString()
				: undefined,
			to: customTo ? new Date(`${customTo}T23:59:59`).toISOString() : undefined,
		};
	const to = new Date();
	const from = new Date();
	if (preset === '7d') from.setDate(from.getDate() - 7);
	else if (preset === '30d') from.setDate(from.getDate() - 30);
	else if (preset === '90d') from.setDate(from.getDate() - 90);
	else from.setDate(1); // mês corrente
	return { from: from.toISOString(), to: to.toISOString() };
}

function formatCents(cents: number) {
	return formatCurrency(cents / 100, 'BRL');
}

const nf = (n: number) => n.toLocaleString('pt-BR');

const abbrev = (v: number) =>
	v >= 1_000_000
		? `${(v / 1_000_000).toFixed(1)}M`
		: v >= 1_000
			? `${(v / 1_000).toFixed(0)}k`
			: `${v}`;

const TOOLTIP = {
	background: '#1a1a1d',
	border: '1px solid #ffffff1a',
	borderRadius: '12px',
	color: '#fff',
	fontSize: 12,
};

// Paleta determinística para as fatias da pizza / pontos da legenda.
const SLICE_COLORS = [
	'#7c3aed',
	'#0ea5e9',
	'#10b981',
	'#f59e0b',
	'#ef4444',
	'#ec4899',
	'#14b8a6',
	'#8b5cf6',
	'#f97316',
	'#22c55e',
];

/* ──────────────────────────────────────────────────────────────────────── */
/*  Ordenação da tabela                                                       */
/* ──────────────────────────────────────────────────────────────────────── */

type SortKey =
	| 'tool_name'
	| 'usage_count'
	| 'voxes'
	| 'platform_cost_cents'
	| 'unique_customers'
	| 'refund_count';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
	{ key: 'tool_name', label: 'Ferramenta', align: 'left' },
	{ key: 'usage_count', label: 'Usos', align: 'right' },
	{ key: 'voxes', label: 'Voxxys', align: 'right' },
	{ key: 'platform_cost_cents', label: 'Custo (R$)', align: 'right' },
	{ key: 'unique_customers', label: 'Usuários', align: 'right' },
	{ key: 'refund_count', label: 'Refunds', align: 'right' },
];

function normalize(value: string): string {
	return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Componente                                                                */
/* ──────────────────────────────────────────────────────────────────────── */

export function ToolAnalyticsView() {
	const [preset, setPreset] = useState<DatePreset>('30d');
	const [customFrom, setCustomFrom] = useState('');
	const [customTo, setCustomTo] = useState('');
	const [group, setGroup] = useState<ToolUsageGroup>('day');
	const [status, setStatus] = useState<ToolUsageStatus>('succeeded');
	const [search, setSearch] = useState('');
	const [sortKey, setSortKey] = useState<SortKey>('usage_count');
	const [sortDir, setSortDir] = useState<SortDir>('desc');

	const range = getRange(preset, customFrom, customTo);

	const params: ToolUsageParams = {
		from: range.from,
		to: range.to,
		status,
		group,
	};

	const { data, isLoading, isFetching, refetch } = useToolUsage(params);

	const totals = data?.totals;
	const tools = data?.tools ?? [];
	const series = data?.series ?? [];

	// Barras: série temporal (já vem ordenada por período do backend).
	const barData = useMemo(
		() =>
			series.map((p) => ({
				label: p.period,
				usos: p.usage_count,
				voxes: p.voxes,
			})),
		[series],
	);

	// Pizza: composição por voxxys (top 9 + "Outras").
	const pieData = useMemo(() => {
		const sorted = [...tools]
			.filter((t) => t.voxes > 0)
			.sort((a, b) => b.voxes - a.voxes);
		const top = sorted.slice(0, 9);
		const rest = sorted.slice(9);
		const slices = top.map((t, i) => ({
			name: t.tool_name,
			value: t.voxes,
			color: SLICE_COLORS[i % SLICE_COLORS.length],
		}));
		if (rest.length > 0) {
			slices.push({
				name: `Outras (${rest.length})`,
				value: rest.reduce((s, t) => s + t.voxes, 0),
				color: '#475569',
			});
		}
		return slices;
	}, [tools]);

	// Top ferramentas por usos (até 5).
	const topTools = useMemo(
		() => [...tools].sort((a, b) => b.usage_count - a.usage_count).slice(0, 5),
		[tools],
	);
	const maxUsage = topTools[0]?.usage_count ?? 0;

	// Tabela: busca + ordenação client-side (a fonte continua sendo
	// response.tools — GROUP BY tool_key — então toda tool nova entra sozinha).
	const tableRows = useMemo(() => {
		const q = normalize(search.trim());
		const filtered = q
			? tools.filter((t) =>
					normalize(
						`${t.tool_name} ${t.tool_key} ${t.category ?? ''}`,
					).includes(q),
				)
			: tools;
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...filtered].sort((a, b) => {
			if (sortKey === 'tool_name')
				return a.tool_name.localeCompare(b.tool_name, 'pt-BR') * dir;
			return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
		});
	}, [tools, search, sortKey, sortDir]);

	function toggleSort(key: SortKey) {
		if (key === sortKey) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortDir(key === 'tool_name' ? 'asc' : 'desc');
		}
	}

	const hasData = !isLoading && (totals?.usage_count ?? 0) > 0;
	const isEmpty = !isLoading && (totals?.usage_count ?? 0) === 0;

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6">
			{/* Cabeçalho */}
			<header className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
					<Wrench className="h-6 w-6 text-violet-500" />
					Analytics de ferramentas
				</h1>
				<p className="text-sm text-slate-500 dark:text-gray-400">
					Uso, voxxys consumidos e custo de plataforma por ferramenta. Toda
					ferramenta nova aparece automaticamente.
				</p>
			</header>

			{/* Filtros */}
			<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
				<div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
					{DATE_PRESETS.map((p) => (
						<button
							key={p.value}
							type="button"
							onClick={() => setPreset(p.value)}
							className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
								preset === p.value
									? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
									: 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
							}`}
						>
							{p.label}
						</button>
					))}
				</div>

				{preset === 'custom' && (
					<div className="flex items-center gap-2">
						<input
							type="date"
							value={customFrom}
							onChange={(e) => setCustomFrom(e.target.value)}
							className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500/50 focus:outline-none dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
						/>
						<span className="text-sm text-slate-400">até</span>
						<input
							type="date"
							value={customTo}
							onChange={(e) => setCustomTo(e.target.value)}
							className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500/50 focus:outline-none dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
						/>
					</div>
				)}

				{/* Status */}
				<div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
					{STATUS_OPTIONS.map((s) => (
						<button
							key={s.value}
							type="button"
							onClick={() => setStatus(s.value)}
							className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
								status === s.value
									? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
									: 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
							}`}
						>
							{s.label}
						</button>
					))}
				</div>

				<button
					type="button"
					onClick={() => refetch()}
					className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:border-slate-300 dark:border-white/10 dark:text-gray-500 dark:hover:border-white/20"
				>
					<RefreshCw
						className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
					/>
					Atualizar
				</button>
			</div>

			{/* Hero cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<HeroCard
					label="Total de usos"
					value={isLoading ? null : nf(totals?.usage_count ?? 0)}
					sub={
						totals
							? `${nf(totals.tool_count)} ferramentas · ${nf(totals.unique_customers)} usuários`
							: undefined
					}
					Icon={Wrench}
					accent="violet"
				/>
				<HeroCard
					label="Voxxys consumidos"
					value={isLoading ? null : nf(totals?.voxes ?? 0)}
					IconNode={<VoxxysIcon className="h-4 w-4" />}
					accent="amber"
				/>
				<HeroCard
					label="Custo de plataforma"
					value={
						isLoading ? null : formatCents(totals?.platform_cost_cents ?? 0)
					}
					Icon={Coins}
					accent="rose"
				/>
				<HeroCard
					label="Voxxys por uso"
					value={
						isLoading
							? null
							: totals && totals.usage_count > 0
								? (totals.voxes / totals.usage_count).toFixed(2)
								: '0'
					}
					sub="ticket médio de voxxys"
					Icon={TrendingUp}
					accent="emerald"
				/>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center py-24">
					<Loader2 className="h-6 w-6 animate-spin text-violet-500" />
				</div>
			)}

			{isEmpty && (
				<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
					<div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-gray-500">
						<BarChart3 className="h-6 w-6" />
					</div>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nenhum uso de ferramenta no período selecionado.
					</p>
				</div>
			)}

			{hasData && (
				<>
					{/* Gráficos */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<ChartCard
							title="Usos por período"
							Icon={BarChart3}
							action={
								<div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
									{(['day', 'month'] as ToolUsageGroup[]).map((g) => (
										<button
											key={g}
											type="button"
											onClick={() => setGroup(g)}
											className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
												group === g
													? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
													: 'text-slate-500 dark:text-gray-400'
											}`}
										>
											{g === 'day' ? 'Dia' : 'Mês'}
										</button>
									))}
								</div>
							}
						>
							{barData.length > 0 ? (
								<ResponsiveContainer width="100%" height={260}>
									<BarChart
										data={barData}
										margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
										barGap={2}
									>
										<CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
										<XAxis
											dataKey="label"
											stroke="#6b7280"
											tick={{ fill: '#6b7280', fontSize: 11 }}
											tickLine={false}
											axisLine={false}
										/>
										<YAxis
											stroke="#6b7280"
											tick={{ fill: '#6b7280', fontSize: 11 }}
											tickLine={false}
											axisLine={false}
											tickFormatter={abbrev}
										/>
										<Tooltip
											cursor={{ fill: '#7c3aed12' }}
											contentStyle={TOOLTIP}
											labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
											formatter={(value, name) => [
												nf(Number(value)),
												String(name),
											]}
										/>
										<Legend
											wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
											iconType="circle"
										/>
										<Bar
											dataKey="usos"
											name="Usos"
											fill="#7c3aed"
											radius={[4, 4, 0, 0]}
											isAnimationActive={false}
										/>
										<Bar
											dataKey="voxes"
											name="Voxxys"
											fill="#f59e0b"
											radius={[4, 4, 0, 0]}
											isAnimationActive={false}
										/>
									</BarChart>
								</ResponsiveContainer>
							) : (
								<Empty text="Sem série no período" />
							)}
						</ChartCard>

						<ChartCard
							title="Composição por ferramenta (voxxys)"
							Icon={PieIcon}
						>
							{pieData.length > 0 ? (
								<ResponsiveContainer width="100%" height={260}>
									<PieChart>
										<Pie
											data={pieData}
											dataKey="value"
											nameKey="name"
											cx="50%"
											cy="50%"
											innerRadius={58}
											outerRadius={88}
											paddingAngle={2}
											stroke="none"
											isAnimationActive={false}
										>
											{pieData.map((s) => (
												<Cell key={s.name} fill={s.color} />
											))}
										</Pie>
										<Tooltip
											contentStyle={TOOLTIP}
											formatter={(value, name) => [
												nf(Number(value)),
												String(name),
											]}
										/>
										<Legend
											wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
											iconType="circle"
											verticalAlign="bottom"
											height={56}
										/>
									</PieChart>
								</ResponsiveContainer>
							) : (
								<Empty text="Sem voxxys no período" />
							)}
						</ChartCard>
					</div>

					{/* Top ferramentas */}
					{topTools.length > 0 && (
						<div className="rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur-sm dark:border-white/8 dark:bg-white/[0.03]">
							<h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400">
								<TrendingUp className="h-4 w-4" />
								Top ferramentas
							</h3>
							<div className="space-y-4">
								{topTools.map((t, i) => (
									<div key={t.tool_key} className="flex items-center gap-3">
										<span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 dark:text-gray-600">
											{i + 1}
										</span>
										<div className="min-w-0 flex-1">
											<div className="mb-1 flex items-center justify-between gap-3">
												<span className="truncate text-sm font-medium text-slate-800 dark:text-gray-200">
													{t.tool_name}
												</span>
												<span className="shrink-0 text-xs font-semibold text-slate-900 dark:text-white">
													{nf(t.usage_count)} usos
												</span>
											</div>
											<div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
												<div
													className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
													style={{
														width: `${maxUsage ? (t.usage_count / maxUsage) * 100 : 0}%`,
													}}
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Tabela por ferramenta */}
					<div className="space-y-3">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
								Por ferramenta
							</h3>
							<div className="relative w-full sm:w-72">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
								<input
									type="text"
									placeholder="Buscar ferramenta…"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500/50 focus:outline-none dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white dark:placeholder:text-gray-500"
								/>
							</div>
						</div>

						<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-transparent">
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]">
											{COLUMNS.map((col) => (
												<th
													key={col.key}
													className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-500 ${
														col.align === 'right' ? 'text-right' : 'text-left'
													}`}
												>
													<button
														type="button"
														onClick={() => toggleSort(col.key)}
														className={`inline-flex items-center gap-1 transition-colors hover:text-slate-700 dark:hover:text-gray-300 ${
															col.align === 'right' ? 'flex-row-reverse' : ''
														} ${sortKey === col.key ? 'text-slate-900 dark:text-white' : ''}`}
													>
														{col.label}
														<SortIcon
															active={sortKey === col.key}
															dir={sortDir}
														/>
													</button>
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 dark:divide-white/5">
										{tableRows.length === 0 && (
											<tr>
												<td
													colSpan={COLUMNS.length}
													className="py-12 text-center text-slate-500 dark:text-gray-500"
												>
													Nenhuma ferramenta encontrada.
												</td>
											</tr>
										)}
										{tableRows.map((row) => (
											<ToolRow key={row.tool_key} row={row} />
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Subcomponentes                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

const ACCENTS = {
	violet: {
		from: 'dark:via-violet-950/20 via-violet-50/40',
		to: 'dark:to-purple-950/10 to-purple-50/30',
		blob: 'bg-violet-500/15 dark:bg-violet-500/10',
		icon: 'text-violet-400 bg-violet-500/10',
	},
	amber: {
		from: 'dark:via-amber-950/20 via-amber-50/40',
		to: 'dark:to-orange-950/10 to-orange-50/30',
		blob: 'bg-amber-500/15 dark:bg-amber-500/10',
		icon: 'text-amber-400 bg-amber-500/10',
	},
	rose: {
		from: 'dark:via-rose-950/20 via-rose-50/40',
		to: 'dark:to-red-950/10 to-red-50/30',
		blob: 'bg-rose-500/15 dark:bg-rose-500/10',
		icon: 'text-rose-400 bg-rose-500/10',
	},
	emerald: {
		from: 'dark:via-emerald-950/20 via-emerald-50/40',
		to: 'dark:to-green-950/10 to-green-50/30',
		blob: 'bg-emerald-500/15 dark:bg-emerald-500/10',
		icon: 'text-emerald-400 bg-emerald-500/10',
	},
} as const;

function HeroCard({
	label,
	value,
	sub,
	Icon,
	IconNode,
	accent,
}: {
	label: string;
	value: string | null;
	sub?: string;
	Icon?: typeof Wrench;
	IconNode?: React.ReactNode;
	accent: keyof typeof ACCENTS;
}) {
	const a = ACCENTS[accent];
	return (
		<div
			className={`relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white ${a.from} ${a.to} p-4 dark:border-white/10 dark:from-[#1a1a1d]`}
		>
			<div
				className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${a.blob}`}
			/>
			<div className="relative flex items-center justify-between">
				<p className="text-xs font-medium text-slate-500 dark:text-gray-500">
					{label}
				</p>
				<span className={`rounded-lg p-1.5 ${a.icon}`}>
					{IconNode ?? (Icon ? <Icon className="h-4 w-4" /> : null)}
				</span>
			</div>
			{value == null ? (
				<div className="relative h-7 w-20 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5" />
			) : (
				<p className="relative text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
					{value}
				</p>
			)}
			{sub && (
				<p className="relative -mt-1 text-[11px] text-slate-400 dark:text-gray-600">
					{sub}
				</p>
			)}
		</div>
	);
}

function ChartCard({
	title,
	Icon,
	action,
	children,
}: {
	title: string;
	Icon: typeof BarChart3;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-white/[0.03] dark:shadow-none">
			<div className="mb-6 flex items-center justify-between gap-3">
				<h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400">
					<Icon className="h-4 w-4" />
					{title}
				</h3>
				{action}
			</div>
			{children}
		</div>
	);
}

const Empty = ({ text }: { text: string }) => (
	<div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-gray-500">
		{text}
	</div>
);

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
	if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
	return dir === 'asc' ? (
		<ArrowUp className="h-3 w-3" />
	) : (
		<ArrowDown className="h-3 w-3" />
	);
}

function ToolRow({ row }: { row: ToolUsageRow }) {
	return (
		<tr className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
			<td className="px-4 py-3">
				<p className="truncate font-medium text-slate-900 dark:text-white">
					{row.tool_name}
				</p>
				<p className="truncate text-xs text-slate-400 dark:text-gray-600">
					{row.category ? `${row.category} · ` : ''}
					{row.tool_key}
				</p>
			</td>
			<td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
				{nf(row.usage_count)}
			</td>
			<td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-500">
				{nf(row.voxes)}
			</td>
			<td className="whitespace-nowrap px-4 py-3 text-right text-slate-700 dark:text-gray-300">
				{formatCents(row.platform_cost_cents)}
			</td>
			<td className="px-4 py-3 text-right text-slate-700 dark:text-gray-300">
				<span className="inline-flex items-center gap-1 justify-end">
					<Users className="h-3 w-3 text-slate-400 dark:text-gray-600" />
					{nf(row.unique_customers)}
				</span>
			</td>
			<td className="px-4 py-3 text-right">
				{row.refund_count > 0 ? (
					<span className="inline-flex items-center gap-1 text-rose-500">
						<RotateCcw className="h-3 w-3" />
						{nf(row.refund_count)}
					</span>
				) : (
					<span className="text-slate-300 dark:text-gray-700">—</span>
				)}
			</td>
		</tr>
	);
}
