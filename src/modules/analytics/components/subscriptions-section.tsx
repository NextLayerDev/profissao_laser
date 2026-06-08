'use client';

import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	ChevronLeft,
	ChevronRight,
	RefreshCw,
	Search,
	TrendingUp,
	Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { useSalesAnalytics, useSalesSummary } from '../hooks/use-analytics';
import type { SalesAnalyticsParams } from '../types/analytics';

type DatePreset = '7d' | '30d' | '90d' | 'custom';
type StatusFilter =
	| 'active'
	| 'trialing'
	| 'past_due'
	| 'canceled'
	| 'paused'
	| '';
type SortOption =
	| 'created_at:desc'
	| 'created_at:asc'
	| 'current_period_end:asc'
	| 'current_period_end:desc';

const STATUS_CONFIG: Record<
	string,
	{ label: string; bg: string; text: string; dot: string }
> = {
	active: {
		label: 'Ativo',
		bg: 'bg-emerald-500/10',
		text: 'text-emerald-500',
		dot: 'bg-emerald-500',
	},
	trialing: {
		label: 'Trial',
		bg: 'bg-sky-500/10',
		text: 'text-sky-400',
		dot: 'bg-sky-400',
	},
	past_due: {
		label: 'Vencido',
		bg: 'bg-amber-500/10',
		text: 'text-amber-400',
		dot: 'bg-amber-400',
	},
	canceled: {
		label: 'Cancelado',
		bg: 'bg-rose-500/10',
		text: 'text-rose-400',
		dot: 'bg-rose-400',
	},
	paused: {
		label: 'Pausado',
		bg: 'bg-slate-500/10',
		text: 'text-slate-400',
		dot: 'bg-slate-400',
	},
};

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
	{ value: '7d', label: '7 dias' },
	{ value: '30d', label: '30 dias' },
	{ value: '90d', label: '90 dias' },
	{ value: 'custom', label: 'Personalizado' },
];

const PER_PAGE = 20;

function getRange(preset: DatePreset, customFrom: string, customTo: string) {
	if (preset === 'custom')
		return {
			from: customFrom || undefined,
			to: customTo || undefined,
		};
	const to = new Date();
	const from = new Date();
	if (preset === '7d') from.setDate(from.getDate() - 7);
	else if (preset === '30d') from.setDate(from.getDate() - 30);
	else from.setDate(from.getDate() - 90);
	return { from: from.toISOString(), to: to.toISOString() };
}

function formatCents(cents: number) {
	return formatCurrency(cents / 100, 'BRL');
}

export function SubscriptionsSection() {
	const [preset, setPreset] = useState<DatePreset>('30d');
	const [customFrom, setCustomFrom] = useState('');
	const [customTo, setCustomTo] = useState('');
	const [status, setStatus] = useState<StatusFilter>('');
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState<SortOption>('created_at:desc');
	const [page, setPage] = useState(1);

	const range = getRange(preset, customFrom, customTo);

	const sharedParams: Omit<SalesAnalyticsParams, 'page' | 'per_page' | 'sort'> =
		{
			from: range.from,
			to: range.to,
			...(status && { status }),
			...(search.trim() && { q: search.trim() }),
		};

	const listParams: SalesAnalyticsParams = {
		...sharedParams,
		page,
		per_page: PER_PAGE,
		sort,
	};

	const {
		data: summary,
		isLoading: summaryLoading,
		refetch: refetchSummary,
	} = useSalesSummary(sharedParams);
	const {
		data: analytics,
		isLoading: listLoading,
		isFetching,
		refetch: refetchList,
	} = useSalesAnalytics(listParams);

	function handleStatusChip(s: StatusFilter) {
		setStatus((prev) => (prev === s ? '' : s));
		setPage(1);
	}

	function handleSearch(v: string) {
		setSearch(v);
		setPage(1);
	}

	function handlePreset(p: DatePreset) {
		setPreset(p);
		setPage(1);
	}

	const statuses = (
		['active', 'trialing', 'past_due', 'canceled', 'paused'] as StatusFilter[]
	).filter(Boolean) as NonNullable<StatusFilter>[];

	const totalPages = analytics?.total_pages ?? 1;
	const paginationRange = useMemo(() => {
		const range: (number | '...')[] = [];
		const delta = 2;
		for (let i = 1; i <= totalPages; i++) {
			if (
				i === 1 ||
				i === totalPages ||
				(i >= page - delta && i <= page + delta)
			) {
				range.push(i);
			} else if (range[range.length - 1] !== '...') {
				range.push('...');
			}
		}
		return range;
	}, [totalPages, page]);

	return (
		<div className="space-y-5">
			{/* Summary cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<SummaryCard
					label="MRR"
					value={summaryLoading ? null : formatCents(summary?.mrr_cents ?? 0)}
					icon={<TrendingUp className="w-4 h-4" />}
					color="violet"
				/>
				<SummaryCard
					label="Receita estimada"
					value={
						summaryLoading
							? null
							: formatCents(summary?.estimated_revenue_cents ?? 0)
					}
					icon={<TrendingUp className="w-4 h-4" />}
					color="emerald"
				/>
				<SummaryCard
					label="Novos (período)"
					value={summaryLoading ? null : String(summary?.new_sales ?? 0)}
					icon={<Users className="w-4 h-4" />}
					color="sky"
				/>
				<SummaryCard
					label="Risco de churn"
					value={
						summaryLoading ? null : `${summary?.predicted_churn.count ?? 0} sub`
					}
					sub={
						summary
							? formatCents(summary.predicted_churn.mrr_at_risk_cents) +
								' MRR em risco'
							: undefined
					}
					icon={<AlertTriangle className="w-4 h-4" />}
					color="amber"
				/>
			</div>

			{/* Status breakdown chips */}
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => handleStatusChip('')}
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
						status === ''
							? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
							: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
					}`}
				>
					Todos
					{!summaryLoading && summary && (
						<span className="opacity-70">
							{Object.values(summary.totals_by_status).reduce(
								(a, b) => a + b,
								0,
							)}
						</span>
					)}
				</button>
				{statuses.map((s) => {
					const cfg = STATUS_CONFIG[s];
					const count =
						summary?.totals_by_status[
							s as keyof typeof summary.totals_by_status
						];
					return (
						<button
							key={s}
							type="button"
							onClick={() => handleStatusChip(s)}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
								status === s
									? `${cfg.bg} ${cfg.text} border-current/30`
									: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${status === s ? cfg.dot : 'bg-current'}`}
							/>
							{cfg.label}
							{!summaryLoading && count !== undefined && (
								<span className="opacity-70">{count}</span>
							)}
						</button>
					);
				})}

				<button
					type="button"
					onClick={() => {
						refetchSummary();
						refetchList();
					}}
					className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-500 hover:border-slate-300 dark:hover:border-white/20 transition-all"
				>
					<RefreshCw className="w-3 h-3" />
					Atualizar
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-3">
				{/* Date presets */}
				<div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 shrink-0">
					{DATE_PRESETS.map((p) => (
						<button
							key={p.value}
							type="button"
							onClick={() => handlePreset(p.value)}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
								preset === p.value
									? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
									: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
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
							onChange={(e) => {
								setCustomFrom(e.target.value);
								setPage(1);
							}}
							className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
						/>
						<span className="text-slate-400 text-sm">até</span>
						<input
							type="date"
							value={customTo}
							onChange={(e) => {
								setCustomTo(e.target.value);
								setPage(1);
							}}
							className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
						/>
					</div>
				)}

				{/* Search */}
				<div className="relative flex-1 min-w-0">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
					<input
						type="text"
						placeholder="Buscar por nome ou e-mail..."
						value={search}
						onChange={(e) => handleSearch(e.target.value)}
						className="w-full bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
					/>
				</div>

				{/* Sort */}
				<select
					value={sort}
					onChange={(e) => {
						setSort(e.target.value as SortOption);
						setPage(1);
					}}
					className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 appearance-none shrink-0"
				>
					<option value="created_at:desc">Mais recentes</option>
					<option value="created_at:asc">Mais antigos</option>
					<option value="current_period_end:asc">Renova em breve</option>
					<option value="current_period_end:desc">Renova mais tarde</option>
				</select>
			</div>

			{/* Table */}
			<div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Cliente
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Plano
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									MRR
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
									Valor da Venda
								</th>
								<th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Status
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
									Próxima cobrança
								</th>
								<th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
									Intervalo
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-white/5">
							{(listLoading || isFetching) && !analytics?.data.length && (
								<tr>
									<td colSpan={7} className="text-center py-16">
										<div className="flex justify-center">
											<div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
										</div>
									</td>
								</tr>
							)}
							{!listLoading && analytics?.data.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="text-center py-16 text-slate-500 dark:text-gray-500"
									>
										Nenhuma assinatura encontrada
									</td>
								</tr>
							)}
							{analytics?.data.map((row) => {
								const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.canceled;
								const isCancel = row.cancel_at_period_end;
								return (
									<tr
										key={row.subscription_id}
										className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
									>
										<td className="px-4 py-3">
											<p className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
												{row.customer.name}
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-500 truncate max-w-[180px]">
												{row.customer.email}
											</p>
										</td>
										<td className="px-4 py-3">
											<p className="text-slate-900 dark:text-white font-medium">
												{row.plan.name}
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-500 font-mono">
												{row.plan.key}
											</p>
										</td>
										<td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
											{formatCents(row.mrr_cents)}
										</td>
										<td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
											{formatCents(row.sale_value_cents)}
										</td>
										<td className="px-4 py-3 text-center">
											<span
												className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
											>
												<span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
												{cfg.label}
											</span>
											{isCancel && (
												<span className="block text-xs text-rose-400 mt-0.5 whitespace-nowrap">
													cancela no fim
												</span>
											)}
										</td>
										<td className="px-4 py-3 text-slate-600 dark:text-gray-300 whitespace-nowrap text-xs">
											{formatDate(row.current_period_end)}
										</td>
										<td className="px-4 py-3 text-center">
											<span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
												{row.interval === 'yearly' ? (
													<>
														<ArrowUp className="w-3 h-3 text-violet-400" />
														Anual
													</>
												) : (
													<>
														<ArrowDown className="w-3 h-3 text-sky-400" />
														Mensal
													</>
												)}
											</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{analytics && analytics.total_pages > 1 && (
					<div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5">
						<p className="text-xs text-slate-500 dark:text-gray-500">
							{analytics.total} resultados · página {page} de{' '}
							{analytics.total_pages}
						</p>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							{paginationRange.map((p, i) =>
								p === '...' ? (
									<span
										key={`ellipsis-${i}`}
										className="px-1 text-slate-400 text-xs"
									>
										…
									</span>
								) : (
									<button
										key={p}
										type="button"
										onClick={() => setPage(p)}
										className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
											page === p
												? 'bg-violet-600 text-white'
												: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
										}`}
									>
										{p}
									</button>
								),
							)}
							<button
								type="button"
								onClick={() =>
									setPage((p) => Math.min(analytics.total_pages, p + 1))
								}
								disabled={page === analytics.total_pages}
								className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Summary card ────────────────────────────────────────

interface SummaryCardProps {
	label: string;
	value: string | null;
	sub?: string;
	icon: React.ReactNode;
	color: 'violet' | 'emerald' | 'sky' | 'amber';
}

const COLOR_MAP = {
	violet: {
		icon: 'text-violet-400 bg-violet-500/10',
		gradient:
			'bg-gradient-to-br from-white via-violet-50/40 to-purple-50/30 dark:from-[#1a1a1d] dark:via-violet-950/20 dark:to-purple-950/10',
		blob1: 'bg-violet-500/15 dark:bg-violet-500/10',
		blob2: 'bg-purple-500/10 dark:bg-purple-500/10',
	},
	emerald: {
		icon: 'text-emerald-400 bg-emerald-500/10',
		gradient:
			'bg-gradient-to-br from-white via-emerald-50/40 to-green-50/30 dark:from-[#1a1a1d] dark:via-emerald-950/20 dark:to-green-950/10',
		blob1: 'bg-emerald-500/15 dark:bg-emerald-500/10',
		blob2: 'bg-green-500/10 dark:bg-green-500/10',
	},
	sky: {
		icon: 'text-sky-400 bg-sky-500/10',
		gradient:
			'bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10',
		blob1: 'bg-sky-500/15 dark:bg-sky-500/10',
		blob2: 'bg-indigo-500/10 dark:bg-indigo-500/10',
	},
	amber: {
		icon: 'text-amber-400 bg-amber-500/10',
		gradient:
			'bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30 dark:from-[#1a1a1d] dark:via-amber-950/20 dark:to-orange-950/10',
		blob1: 'bg-amber-500/15 dark:bg-amber-500/10',
		blob2: 'bg-orange-500/10 dark:bg-orange-500/10',
	},
};

function SummaryCard({ label, value, sub, icon, color }: SummaryCardProps) {
	const c = COLOR_MAP[color];
	return (
		<div
			className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex flex-col gap-3 ${c.gradient}`}
		>
			<div
				className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${c.blob1}`}
			/>
			<div
				className={`pointer-events-none absolute -bottom-10 -left-6 w-28 h-28 rounded-full blur-3xl ${c.blob2}`}
			/>
			<div className="relative flex items-center justify-between">
				<p className="text-xs font-medium text-slate-500 dark:text-gray-500">
					{label}
				</p>
				<span className={`p-1.5 rounded-lg ${c.icon}`}>{icon}</span>
			</div>
			{value === null ? (
				<div className="relative h-7 w-24 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
			) : (
				<p className="relative text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
					{value}
				</p>
			)}
			{sub && (
				<p className="relative text-xs text-slate-500 dark:text-gray-500">
					{sub}
				</p>
			)}
		</div>
	);
}
