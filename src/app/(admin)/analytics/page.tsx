'use client';

import {
	AlertTriangle,
	ArrowDownUp,
	BarChart2,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	CircleDot,
	Loader2,
	RefreshCw,
	Search,
	TrendingDown,
	TrendingUp,
	Users,
	X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { PageHeader } from '@/components/ui/page-header';
import { useAnalyticsSales, useAnalyticsSummary } from '@/hooks/use-analytics';
import type {
	AnalyticsSalesParams,
	AnalyticsSalesSort,
	AnalyticsSalesStatus,
} from '@/types/analytics';

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmt(cents: number) {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(cents / 100);
}

function fmtDate(iso: string) {
	return new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

const STATUS_LABEL: Record<AnalyticsSalesStatus, string> = {
	active: 'Ativo',
	trialing: 'Trial',
	past_due: 'Inadimplente',
	canceled: 'Cancelado',
	paused: 'Pausado',
};

const STATUS_COLOR: Record<AnalyticsSalesStatus, string> = {
	active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	trialing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
	past_due: 'bg-red-500/15 text-red-600 dark:text-red-400',
	canceled: 'bg-slate-500/15 text-slate-500',
	paused: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

const SORT_OPTIONS: { value: AnalyticsSalesSort; label: string }[] = [
	{ value: 'created_at:desc', label: 'Mais recentes' },
	{ value: 'created_at:asc', label: 'Mais antigos' },
	{ value: 'current_period_end:asc', label: 'Vence em breve' },
	{ value: 'current_period_end:desc', label: 'Vence mais tarde' },
	{ value: 'price_cents:desc', label: 'Maior valor' },
	{ value: 'price_cents:asc', label: 'Menor valor' },
];

// ─── Summary cards ─────────────────────────────────────────────────────────

function SummaryCards({
	params,
}: {
	params: Omit<AnalyticsSalesParams, 'page' | 'per_page' | 'sort'>;
}) {
	const { data, isLoading } = useAnalyticsSummary(params);

	const cards = [
		{
			label: 'MRR',
			value: isLoading ? null : fmt(data?.mrr_cents ?? 0),
			sub: 'Receita recorrente mensal',
			icon: TrendingUp,
			gradient:
				'from-violet-600/25 to-[#1a1a1d] dark:from-violet-600/25 dark:to-[#1a1a1d] from-violet-100 to-white',
			border: 'border-violet-500/20 dark:border-violet-500/20',
			iconColor: 'text-violet-500',
			iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
			glow: 'bg-violet-500',
		},
		{
			label: 'Novas assinaturas',
			value: isLoading ? null : String(data?.new_sales ?? 0),
			sub: 'No período selecionado',
			icon: Users,
			gradient:
				'from-sky-600/25 to-[#1a1a1d] dark:from-sky-600/25 dark:to-[#1a1a1d] from-sky-100 to-white',
			border: 'border-sky-500/20 dark:border-sky-500/20',
			iconColor: 'text-sky-500',
			iconBg: 'bg-sky-500/10 dark:bg-sky-500/15',
			glow: 'bg-sky-500',
		},
		{
			label: 'Receita estimada',
			value: isLoading ? null : fmt(data?.estimated_revenue_cents ?? 0),
			sub: 'Anualizado (MRR × 12)',
			icon: BarChart2,
			gradient:
				'from-emerald-600/25 to-[#1a1a1d] dark:from-emerald-600/25 dark:to-[#1a1a1d] from-emerald-100 to-white',
			border: 'border-emerald-500/20 dark:border-emerald-500/20',
			iconColor: 'text-emerald-500',
			iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
			glow: 'bg-emerald-500',
		},
		{
			label: 'Churn previsto',
			value: isLoading ? null : `${data?.predicted_churn.count ?? 0} assin.`,
			sub: isLoading
				? ''
				: `${fmt(data?.predicted_churn.mrr_at_risk_cents ?? 0)} em risco`,
			icon: TrendingDown,
			gradient:
				'from-rose-600/25 to-[#1a1a1d] dark:from-rose-600/25 dark:to-[#1a1a1d] from-rose-100 to-white',
			border: 'border-rose-500/20 dark:border-rose-500/20',
			iconColor: 'text-rose-500',
			iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
			glow: 'bg-rose-500',
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
			{cards.map((c) => (
				<div
					key={c.label}
					className={`relative overflow-hidden rounded-2xl border ${c.border} bg-linear-to-br ${c.gradient} p-5`}
				>
					{/* Glow blob */}
					<div
						className={`absolute -top-6 -right-6 w-24 h-24 ${c.glow} opacity-10 rounded-full blur-2xl pointer-events-none`}
					/>

					{/* Watermark icon */}
					<c.icon
						className={`absolute -bottom-3 -right-3 w-20 h-20 ${c.iconColor} opacity-[0.06] pointer-events-none`}
						aria-hidden="true"
					/>

					<div className="relative">
						<div className="flex items-start justify-between mb-3">
							<p className="text-xs font-medium text-slate-500 dark:text-gray-400">
								{c.label}
							</p>
							<div className={`p-1.5 rounded-lg ${c.iconBg}`}>
								<c.icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
							</div>
						</div>
						{c.value === null ? (
							<div className="h-7 w-28 rounded-lg bg-slate-200/60 dark:bg-white/5 animate-pulse" />
						) : (
							<p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
								{c.value}
							</p>
						)}
						<p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
							{c.sub}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Status breakdown ──────────────────────────────────────────────────────

function StatusBreakdown({
	params,
}: {
	params: Omit<AnalyticsSalesParams, 'page' | 'per_page' | 'sort'>;
}) {
	const { data, isLoading } = useAnalyticsSummary(params);

	const statuses = (
		['active', 'trialing', 'past_due', 'canceled', 'paused'] as const
	).map((s) => ({
		key: s,
		label: STATUS_LABEL[s],
		count: data?.totals_by_status[s] ?? 0,
	}));

	const total = statuses.reduce((s, c) => s + c.count, 0);

	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-linear-to-br from-slate-50 to-white dark:from-white/[0.03] dark:to-[#1a1a1d] p-5 mb-6">
			{/* Subtle top-left glow */}
			<div className="absolute -top-8 -left-8 w-32 h-32 bg-indigo-500 opacity-[0.06] rounded-full blur-3xl pointer-events-none" />

			<p className="relative text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-4">
				Distribuição por status
			</p>
			{isLoading ? (
				<div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />
			) : (
				<>
					<div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-4">
						{statuses
							.filter((s) => s.count > 0)
							.map((s) => (
								<div
									key={s.key}
									style={{ width: `${((s.count / total) * 100).toFixed(1)}%` }}
									className={`h-full rounded-full ${
										s.key === 'active'
											? 'bg-emerald-500'
											: s.key === 'trialing'
												? 'bg-blue-500'
												: s.key === 'past_due'
													? 'bg-red-500'
													: s.key === 'canceled'
														? 'bg-slate-400'
														: 'bg-amber-500'
									}`}
								/>
							))}
					</div>
					<div className="flex flex-wrap gap-x-5 gap-y-2">
						{statuses.map((s) => (
							<div key={s.key} className="flex items-center gap-2">
								<CircleDot
									className={`w-3 h-3 ${
										s.key === 'active'
											? 'text-emerald-500'
											: s.key === 'trialing'
												? 'text-blue-500'
												: s.key === 'past_due'
													? 'text-red-500'
													: s.key === 'canceled'
														? 'text-slate-400'
														: 'text-amber-500'
									}`}
								/>
								<span className="text-xs text-slate-500 dark:text-gray-400">
									{s.label}
								</span>
								<span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
									{s.count}
								</span>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

// ─── Filters bar ───────────────────────────────────────────────────────────

interface Filters {
	q: string;
	from: string;
	to: string;
	status: AnalyticsSalesStatus | '';
	interval: 'monthly' | 'yearly' | '';
	cancel_at_period_end: '' | 'true' | 'false';
	sort: AnalyticsSalesSort;
}

const DEFAULT_FILTERS: Filters = {
	q: '',
	from: '',
	to: '',
	status: '',
	interval: '',
	cancel_at_period_end: '',
	sort: 'created_at:desc',
};

// ─── Main page ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
	const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
	const [page, setPage] = useState(1);

	const setFilter = useCallback(
		<K extends keyof Filters>(key: K, value: Filters[K]) => {
			setFilters((f) => ({ ...f, [key]: value }));
			setPage(1);
		},
		[],
	);

	const hasActiveFilters = useMemo(
		() =>
			filters.q !== '' ||
			filters.from !== '' ||
			filters.to !== '' ||
			filters.status !== '' ||
			filters.interval !== '' ||
			filters.cancel_at_period_end !== '',
		[filters],
	);

	const queryParams = useMemo<AnalyticsSalesParams>(() => {
		const p: AnalyticsSalesParams = {
			page,
			per_page: 20,
			sort: filters.sort,
		};
		if (filters.q) p.q = filters.q;
		if (filters.from) p.from = filters.from;
		if (filters.to) p.to = filters.to;
		if (filters.status) p.status = filters.status;
		if (filters.interval) p.interval = filters.interval;
		if (filters.cancel_at_period_end !== '')
			p.cancel_at_period_end = filters.cancel_at_period_end === 'true';
		return p;
	}, [filters, page]);

	const summaryParams = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { page: _p, per_page: _pp, sort: _s, ...rest } = queryParams;
		return rest;
	}, [queryParams]);

	const { data, isLoading, isFetching, error, refetch } =
		useAnalyticsSales(queryParams);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
				<div className="flex items-start justify-between mb-6">
					<PageHeader
						title="Analytics de assinaturas"
						subtitle="Visão geral e lista detalhada de todas as assinaturas."
						icon={BarChart2}
					/>
					<button
						type="button"
						onClick={() => refetch()}
						disabled={isFetching}
						className="mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
						title="Atualizar"
					>
						<RefreshCw
							className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
						/>
					</button>
				</div>

				{/* KPIs */}
				<SummaryCards params={summaryParams} />

				{/* Status breakdown */}
				<StatusBreakdown params={summaryParams} />

				{/* Filters */}
				<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-linear-to-br from-slate-50 to-white dark:from-white/[0.03] dark:to-[#1a1a1d] p-4 mb-4">
					<div className="absolute -bottom-6 -right-6 w-24 h-24 bg-violet-500 opacity-[0.05] rounded-full blur-2xl pointer-events-none" />
					<div className="relative flex flex-wrap gap-3">
						{/* Search */}
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
							<input
								type="text"
								placeholder="Nome ou e-mail..."
								value={filters.q}
								onChange={(e) => setFilter('q', e.target.value)}
								className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
							/>
						</div>

						{/* Date from */}
						<div className="relative">
							<CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
							<input
								type="date"
								value={filters.from}
								onChange={(e) => setFilter('from', e.target.value)}
								className="pl-9 pr-3 h-9 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors text-slate-700 dark:text-slate-300"
							/>
						</div>

						{/* Date to */}
						<div className="relative">
							<CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
							<input
								type="date"
								value={filters.to}
								onChange={(e) => setFilter('to', e.target.value)}
								className="pl-9 pr-3 h-9 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors text-slate-700 dark:text-slate-300"
							/>
						</div>

						{/* Status */}
						<select
							value={filters.status}
							onChange={(e) =>
								setFilter('status', e.target.value as AnalyticsSalesStatus | '')
							}
							className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
						>
							<option value="">Todos os status</option>
							{(
								[
									'active',
									'trialing',
									'past_due',
									'canceled',
									'paused',
								] as AnalyticsSalesStatus[]
							).map((s) => (
								<option key={s} value={s}>
									{STATUS_LABEL[s]}
								</option>
							))}
						</select>

						{/* Interval */}
						<select
							value={filters.interval}
							onChange={(e) =>
								setFilter(
									'interval',
									e.target.value as 'monthly' | 'yearly' | '',
								)
							}
							className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
						>
							<option value="">Mensal + Anual</option>
							<option value="monthly">Mensal</option>
							<option value="yearly">Anual</option>
						</select>

						{/* Cancel at period end */}
						<select
							value={filters.cancel_at_period_end}
							onChange={(e) =>
								setFilter(
									'cancel_at_period_end',
									e.target.value as '' | 'true' | 'false',
								)
							}
							className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
						>
							<option value="">Cancelamento: todos</option>
							<option value="true">Cancelamento agendado</option>
							<option value="false">Sem cancelamento</option>
						</select>

						{/* Sort */}
						<div className="relative">
							<ArrowDownUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
							<select
								value={filters.sort}
								onChange={(e) =>
									setFilter('sort', e.target.value as AnalyticsSalesSort)
								}
								className="pl-9 pr-3 h-9 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
							>
								{SORT_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>

						{/* Clear */}
						{hasActiveFilters && (
							<button
								type="button"
								onClick={() => {
									setFilters(DEFAULT_FILTERS);
									setPage(1);
								}}
								className="flex items-center gap-1.5 h-9 px-3 text-sm rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
							>
								<X className="w-3.5 h-3.5" />
								Limpar
							</button>
						)}
					</div>
				</div>

				{/* Table */}
				<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-linear-to-b from-white to-slate-50/50 dark:from-[#1a1a1d] dark:to-[#141416]">
					{/* Top edge gradient accent */}
					<div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/30 to-transparent pointer-events-none" />

					{error ? (
						<div className="flex items-center gap-3 p-6 text-red-500">
							<AlertTriangle className="w-5 h-5 shrink-0" />
							<p className="text-sm">
								Erro ao carregar dados. Tente novamente.
							</p>
						</div>
					) : isLoading ? (
						<div className="flex justify-center py-16">
							<Loader2 className="w-7 h-7 animate-spin text-violet-500" />
						</div>
					) : (data?.data.length ?? 0) === 0 ? (
						<div className="py-16 text-center">
							<BarChart2 className="w-8 h-8 text-slate-300 dark:text-gray-700 mx-auto mb-3" />
							<p className="text-sm text-slate-500 dark:text-gray-400">
								Nenhuma assinatura encontrada
							</p>
						</div>
					) : (
						<>
							{/* Opacity while refetching */}
							<div
								className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}
							>
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wide">
											<th className="px-4 py-3 text-left font-medium">
												Cliente
											</th>
											<th className="px-4 py-3 text-left font-medium">
												Curso / Plano
											</th>
											<th className="px-4 py-3 text-left font-medium">
												Status
											</th>
											<th className="px-4 py-3 text-left font-medium">
												Intervalo
											</th>
											<th className="px-4 py-3 text-right font-medium">
												Valor
											</th>
											<th className="px-4 py-3 text-right font-medium">MRR</th>
											<th className="px-4 py-3 text-left font-medium">
												Próx. cobrança
											</th>
											<th className="px-4 py-3 text-left font-medium">
												Criado em
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 dark:divide-white/5">
										{data?.data.map((row) => (
											<tr
												key={row.subscription_id}
												className="hover:bg-violet-50/40 dark:hover:bg-violet-500/[0.04] transition-colors"
											>
												{/* Cliente */}
												<td className="px-4 py-3">
													<p className="font-medium text-slate-900 dark:text-white truncate max-w-[160px]">
														{row.customer.name}
													</p>
													<p className="text-xs text-slate-400 dark:text-gray-500 truncate max-w-[160px]">
														{row.customer.email}
													</p>
												</td>

												{/* Curso / Plano */}
												<td className="px-4 py-3">
													{row.course ? (
														<p className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
															{row.course.title}
														</p>
													) : (
														<p className="text-slate-400 dark:text-gray-600 text-xs">
															—
														</p>
													)}
													{row.plan && (
														<span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 mt-0.5">
															{row.plan.key}
														</span>
													)}
												</td>

												{/* Status */}
												<td className="px-4 py-3">
													<div className="flex items-center gap-1.5">
														<span
															className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[row.status]}`}
														>
															{STATUS_LABEL[row.status]}
														</span>
														{row.cancel_at_period_end && (
															<span
																title="Cancelamento agendado"
																className="text-amber-500"
															>
																<AlertTriangle className="w-3 h-3" />
															</span>
														)}
													</div>
												</td>

												{/* Intervalo */}
												<td className="px-4 py-3 text-slate-600 dark:text-slate-400">
													{row.interval === 'monthly' ? 'Mensal' : 'Anual'}
												</td>

												{/* Valor */}
												<td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
													{fmt(row.price_cents)}
												</td>

												{/* MRR */}
												<td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-gray-400">
													{fmt(row.mrr_cents)}
												</td>

												{/* Próx. cobrança */}
												<td className="px-4 py-3 text-slate-500 dark:text-gray-400 whitespace-nowrap">
													{fmtDate(row.current_period_end)}
												</td>

												{/* Criado em */}
												<td className="px-4 py-3 text-slate-500 dark:text-gray-400 whitespace-nowrap">
													{fmtDate(row.created_at)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Pagination */}
							{(data?.total_pages ?? 1) > 1 && (
								<div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5">
									<p className="text-xs text-slate-400 dark:text-gray-500">
										{data?.total ?? 0} resultado
										{(data?.total ?? 0) !== 1 ? 's' : ''} · página {data?.page}{' '}
										de {data?.total_pages}
									</p>
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1 || isFetching}
											className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
										>
											<ChevronLeft className="w-4 h-4" />
										</button>

										{Array.from(
											{ length: data?.total_pages ?? 1 },
											(_, i) => i + 1,
										)
											.filter(
												(p) =>
													p === 1 ||
													p === (data?.total_pages ?? 1) ||
													Math.abs(p - page) <= 1,
											)
											.reduce<(number | '…')[]>((acc, p, idx, arr) => {
												if (idx > 0 && p - (arr[idx - 1] as number) > 1)
													acc.push('…');
												acc.push(p);
												return acc;
											}, [])
											.map((p, i) =>
												p === '…' ? (
													<span
														key={`ellipsis-${i}`}
														className="px-1 text-slate-400"
													>
														…
													</span>
												) : (
													<button
														key={p}
														type="button"
														onClick={() => setPage(p)}
														disabled={isFetching}
														className={`min-w-[32px] h-8 px-2 text-sm rounded-lg transition-colors ${
															p === page
																? 'bg-linear-to-br from-violet-600 to-violet-700 text-white font-semibold shadow-sm shadow-violet-500/30'
																: 'border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
														}`}
													>
														{p}
													</button>
												),
											)}

										<button
											type="button"
											onClick={() =>
												setPage((p) => Math.min(data?.total_pages ?? 1, p + 1))
											}
											disabled={page === (data?.total_pages ?? 1) || isFetching}
											className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
										>
											<ChevronRight className="w-4 h-4" />
										</button>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</main>
		</div>
	);
}
