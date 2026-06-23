'use client';

import {
	ChevronLeft,
	ChevronRight,
	RefreshCw,
	Search,
	TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import {
	useInvoicesAnalytics,
	useInvoicesSummary,
} from '../hooks/use-analytics';
import type {
	BillingReason,
	InvoicesAnalyticsParams,
} from '../types/analytics';

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
	{ value: '7d', label: '7 dias' },
	{ value: '30d', label: '30 dias' },
	{ value: '90d', label: '90 dias' },
	{ value: 'custom', label: 'Personalizado' },
];

const PER_PAGE = 20;

const REASON_CONFIG: Record<
	BillingReason,
	{ label: string; bg: string; text: string; dot: string }
> = {
	subscription_create: {
		label: 'Nova assinatura',
		bg: 'bg-emerald-500/10',
		text: 'text-emerald-500',
		dot: 'bg-emerald-500',
	},
	subscription_cycle: {
		label: 'Renovação',
		bg: 'bg-sky-500/10',
		text: 'text-sky-400',
		dot: 'bg-sky-400',
	},
	subscription_update: {
		label: 'Atualização',
		bg: 'bg-violet-500/10',
		text: 'text-violet-400',
		dot: 'bg-violet-400',
	},
	manual: {
		label: 'Manual',
		bg: 'bg-slate-500/10',
		text: 'text-slate-400',
		dot: 'bg-slate-400',
	},
	refund: {
		label: 'Reembolso',
		bg: 'bg-amber-500/10',
		text: 'text-amber-400',
		dot: 'bg-amber-400',
	},
};

const ALL_REASONS = Object.keys(REASON_CONFIG) as BillingReason[];

function getRange(preset: DatePreset, customFrom: string, customTo: string) {
	if (preset === 'custom')
		return { from: customFrom || undefined, to: customTo || undefined };
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

export function InvoicesSection() {
	const [preset, setPreset] = useState<DatePreset>('30d');
	const [customFrom, setCustomFrom] = useState('');
	const [customTo, setCustomTo] = useState('');
	const [search, setSearch] = useState('');
	const [reason, setReason] = useState<BillingReason | ''>('');
	const [page, setPage] = useState(1);

	const range = getRange(preset, customFrom, customTo);

	const sharedParams: Omit<InvoicesAnalyticsParams, 'page' | 'per_page'> = {
		from: range.from,
		to: range.to,
		...(reason && { billing_reason: reason }),
		...(search.trim() && { q: search.trim() }),
	};

	const listParams: InvoicesAnalyticsParams = {
		...sharedParams,
		page,
		per_page: PER_PAGE,
	};

	const {
		data: summary,
		isLoading: summaryLoading,
		refetch: refetchSummary,
	} = useInvoicesSummary(sharedParams);

	const {
		data: analytics,
		isLoading: listLoading,
		isFetching,
		refetch: refetchList,
	} = useInvoicesAnalytics(listParams);

	function handleReasonChip(r: BillingReason | '') {
		setReason((prev) => (prev === r ? '' : r));
		setPage(1);
	}

	const totalPages = analytics?.total_pages ?? 1;
	const paginationRange = useMemo(() => {
		const arr: (number | '...')[] = [];
		const delta = 2;
		for (let i = 1; i <= totalPages; i++) {
			if (
				i === 1 ||
				i === totalPages ||
				(i >= page - delta && i <= page + delta)
			) {
				arr.push(i);
			} else if (arr[arr.length - 1] !== '...') {
				arr.push('...');
			}
		}
		return arr;
	}, [totalPages, page]);

	return (
		<div className="space-y-5">
			{/* Summary cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<SummaryCard
					label="Receita total"
					value={
						summaryLoading
							? null
							: formatCents(summary?.total_revenue_cents ?? 0)
					}
					icon={<TrendingUp className="w-4 h-4" />}
					color="emerald"
				/>
				<SummaryCard
					label="Total de cobranças"
					value={summaryLoading ? null : String(summary?.total_count ?? 0)}
					icon={<TrendingUp className="w-4 h-4" />}
					color="violet"
				/>
				<SummaryCard
					label="Novas assinaturas"
					value={
						summaryLoading
							? null
							: String(summary?.by_reason.subscription_create.count ?? 0)
					}
					sub={
						summary
							? formatCents(summary.by_reason.subscription_create.revenue_cents)
							: undefined
					}
					icon={<TrendingUp className="w-4 h-4" />}
					color="sky"
				/>
				<SummaryCard
					label="Renovações"
					value={
						summaryLoading
							? null
							: String(summary?.by_reason.subscription_cycle.count ?? 0)
					}
					sub={
						summary
							? formatCents(summary.by_reason.subscription_cycle.revenue_cents)
							: undefined
					}
					icon={<TrendingUp className="w-4 h-4" />}
					color="amber"
				/>
			</div>

			{/* Reason filter chips */}
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => handleReasonChip('')}
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
						reason === ''
							? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
							: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
					}`}
				>
					Todos
					{!summaryLoading && summary && (
						<span className="opacity-70">{summary.total_count}</span>
					)}
				</button>

				{ALL_REASONS.map((r) => {
					const cfg = REASON_CONFIG[r];
					const count = summary?.by_reason[r].count;
					return (
						<button
							key={r}
							type="button"
							onClick={() => handleReasonChip(r)}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
								reason === r
									? `${cfg.bg} ${cfg.text} border-current/30`
									: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${reason === r ? cfg.dot : 'bg-current'}`}
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
				<div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 shrink-0">
					{DATE_PRESETS.map((p) => (
						<button
							key={p.value}
							type="button"
							onClick={() => {
								setPreset(p.value);
								setPage(1);
							}}
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

				<div className="relative flex-1 min-w-0">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
					<input
						type="text"
						placeholder="Buscar por nome ou e-mail..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="w-full bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
					/>
				</div>
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
									Valor
								</th>
								<th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Motivo
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
									Período
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
									Pago em
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-white/5">
							{(listLoading || isFetching) && !analytics?.data.length && (
								<tr>
									<td colSpan={6} className="text-center py-16">
										<div className="flex justify-center">
											<div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
										</div>
									</td>
								</tr>
							)}
							{!listLoading && analytics?.data.length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="text-center py-16 text-slate-500 dark:text-gray-500"
									>
										Nenhuma fatura encontrada
									</td>
								</tr>
							)}
							{analytics?.data.map((row) => {
								const cfg = REASON_CONFIG[row.billing_reason];
								return (
									<tr
										key={row.id}
										className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
									>
										<td className="px-4 py-3">
											<p className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
												{row.customer.name ?? '—'}
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-500 truncate max-w-[180px]">
												{row.customer.email}
											</p>
										</td>
										<td className="px-4 py-3">
											{row.plan ? (
												<>
													<p className="text-slate-900 dark:text-white font-medium">
														{row.plan.name}
													</p>
													<p className="text-xs text-slate-500 dark:text-gray-500 font-mono">
														{row.plan.key}
													</p>
												</>
											) : (
												<span className="text-slate-400 dark:text-gray-600 italic text-xs">
													—
												</span>
											)}
										</td>
										<td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
											{formatCents(row.amount_cents)}
										</td>
										<td className="px-4 py-3 text-center">
											<span
												className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
											>
												<span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
												{cfg.label}
											</span>
										</td>
										<td className="px-4 py-3 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">
											{row.period_start && row.period_end
												? `${formatDate(row.period_start)} – ${formatDate(row.period_end)}`
												: '—'}
										</td>
										<td className="px-4 py-3 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">
											{formatDate(row.paid_at)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

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
