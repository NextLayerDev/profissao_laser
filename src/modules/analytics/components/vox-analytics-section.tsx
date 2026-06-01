'use client';

import {
	ChevronLeft,
	ChevronRight,
	Package,
	RefreshCw,
	Search,
	TrendingUp,
	Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { useVoxesAnalytics, useVoxesSummary } from '../hooks/use-analytics';
import type { VoxesAnalyticsParams } from '../types/analytics';

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
	{ value: '7d', label: '7 dias' },
	{ value: '30d', label: '30 dias' },
	{ value: '90d', label: '90 dias' },
	{ value: 'custom', label: 'Personalizado' },
];

const PER_PAGE = 20;

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

export function VoxAnalyticsSection() {
	const [preset, setPreset] = useState<DatePreset>('30d');
	const [customFrom, setCustomFrom] = useState('');
	const [customTo, setCustomTo] = useState('');
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);

	const range = getRange(preset, customFrom, customTo);

	const sharedParams: Omit<VoxesAnalyticsParams, 'page' | 'per_page' | 'sort'> =
		{
			from: range.from,
			to: range.to,
			...(search.trim() && { q: search.trim() }),
		};

	const listParams: VoxesAnalyticsParams = {
		...sharedParams,
		page,
		per_page: PER_PAGE,
		sort: 'created_at:desc',
	};

	const {
		data: summary,
		isLoading: summaryLoading,
		refetch: refetchSummary,
	} = useVoxesSummary(sharedParams);
	const {
		data: analytics,
		isLoading: listLoading,
		isFetching,
		refetch: refetchList,
	} = useVoxesAnalytics(listParams);

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
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Vendas */}
				<div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30 dark:from-[#1a1a1d] dark:via-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex flex-col gap-3">
					<div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl bg-amber-500/15 dark:bg-amber-500/10" />
					<div className="pointer-events-none absolute -bottom-10 -left-6 w-28 h-28 rounded-full blur-3xl bg-orange-500/10" />
					<div className="relative flex items-center justify-between">
						<p className="text-xs font-medium text-slate-500 dark:text-gray-500">
							Vendas
						</p>
						<span className="p-1.5 rounded-lg bg-amber-500/10">
							<VoxxysIcon className="w-4 h-4" />
						</span>
					</div>
					{summaryLoading ? (
						<div className="relative h-7 w-16 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
					) : (
						<p className="relative text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
							{summary?.sales_count ?? 0}
						</p>
					)}
				</div>
				{/* Voxxys vendidos */}
				<div className="relative overflow-hidden bg-gradient-to-br from-white via-violet-50/40 to-purple-50/30 dark:from-[#1a1a1d] dark:via-violet-950/20 dark:to-purple-950/10 rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex flex-col gap-3">
					<div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl bg-violet-500/15 dark:bg-violet-500/10" />
					<div className="pointer-events-none absolute -bottom-10 -left-6 w-28 h-28 rounded-full blur-3xl bg-purple-500/10" />
					<div className="relative flex items-center justify-between">
						<p className="text-xs font-medium text-slate-500 dark:text-gray-500">
							Voxxys vendidos
						</p>
						<span className="p-1.5 rounded-lg text-violet-400 bg-violet-500/10">
							<Zap className="w-4 h-4" />
						</span>
					</div>
					{summaryLoading ? (
						<div className="relative h-7 w-20 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
					) : (
						<p className="relative text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
							{(summary?.voxes_sold ?? 0).toLocaleString('pt-BR')}
						</p>
					)}
				</div>
				{/* Receita */}
				<div className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/40 to-green-50/30 dark:from-[#1a1a1d] dark:via-emerald-950/20 dark:to-green-950/10 rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex flex-col gap-3">
					<div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl bg-emerald-500/15 dark:bg-emerald-500/10" />
					<div className="pointer-events-none absolute -bottom-10 -left-6 w-28 h-28 rounded-full blur-3xl bg-green-500/10" />
					<div className="relative flex items-center justify-between">
						<p className="text-xs font-medium text-slate-500 dark:text-gray-500">
							Receita
						</p>
						<span className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10">
							<TrendingUp className="w-4 h-4" />
						</span>
					</div>
					{summaryLoading ? (
						<div className="relative h-7 w-24 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
					) : (
						<p className="relative text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
							{formatCents(summary?.revenue_cents ?? 0)}
						</p>
					)}
				</div>
			</div>

			{/* Package breakdown */}
			{!summaryLoading && summary && summary.by_package.length > 0 && (
				<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
					<p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide mb-3">
						Por pacote
					</p>
					<div className="space-y-2">
						{summary.by_package.map((pkg) => (
							<div
								key={pkg.vox_package_id ?? 'manual'}
								className="flex items-center justify-between gap-4 text-sm"
							>
								<div className="flex items-center gap-2 min-w-0">
									<Package className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 shrink-0" />
									<span className="truncate text-slate-700 dark:text-gray-300">
										{pkg.package_name ?? 'Ajuste manual'}
									</span>
								</div>
								<div className="flex items-center gap-4 shrink-0 text-xs text-slate-500 dark:text-gray-500">
									<span>{pkg.sales_count} vendas</span>
									<span>{pkg.voxes_sold.toLocaleString('pt-BR')} voxes</span>
									<span className="font-semibold text-slate-900 dark:text-white">
										{formatCents(pkg.revenue_cents)}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

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

				<button
					type="button"
					onClick={() => {
						refetchSummary();
						refetchList();
					}}
					className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-500 hover:border-slate-300 dark:hover:border-white/20 transition-all shrink-0"
				>
					<RefreshCw className="w-3.5 h-3.5" />
					Atualizar
				</button>
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
									Pacote
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Voxxys
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Valor
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Data
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-white/5">
							{(listLoading || isFetching) && !analytics?.data.length && (
								<tr>
									<td colSpan={5} className="text-center py-16">
										<div className="flex justify-center">
											<div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
										</div>
									</td>
								</tr>
							)}
							{!listLoading && analytics?.data.length === 0 && (
								<tr>
									<td
										colSpan={5}
										className="text-center py-16 text-slate-500 dark:text-gray-500"
									>
										Nenhuma venda encontrada
									</td>
								</tr>
							)}
							{analytics?.data.map((row) => (
								<tr
									key={row.ledger_id}
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
									<td className="px-4 py-3 text-slate-700 dark:text-gray-300">
										{row.vox_package?.name ?? (
											<span className="text-slate-400 dark:text-gray-600 italic">
												Ajuste manual
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-right font-semibold text-amber-500">
										+{row.vox_amount.toLocaleString('pt-BR')}
									</td>
									<td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
										{row.price_cents != null
											? formatCents(row.price_cents)
											: '—'}
									</td>
									<td className="px-4 py-3 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">
										{formatDate(row.created_at)}
									</td>
								</tr>
							))}
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
