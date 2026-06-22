'use client';

import {
	ChevronLeft,
	ChevronRight,
	RefreshCw,
	RotateCcw,
	Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { useEntriesAnalytics } from '../hooks/use-analytics';
import type {
	BillingReason,
	EntriesAnalyticsParams,
	EntryRow,
	EntryType,
} from '../types/analytics';
import { RefundSubscriptionModal } from './refund-subscription-modal';

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
	{ value: '7d', label: '7 dias' },
	{ value: '30d', label: '30 dias' },
	{ value: '90d', label: '90 dias' },
	{ value: 'custom', label: 'Personalizado' },
];

const PER_PAGE = 20;

const TYPE_CONFIG: Record<
	EntryType,
	{ label: string; bg: string; text: string; dot: string }
> = {
	subscription: {
		label: 'Assinatura',
		bg: 'bg-emerald-500/10',
		text: 'text-emerald-500',
		dot: 'bg-emerald-500',
	},
	vox: {
		label: 'Voxxys',
		bg: 'bg-violet-500/10',
		text: 'text-violet-400',
		dot: 'bg-violet-400',
	},
};

const ALL_TYPES = Object.keys(TYPE_CONFIG) as EntryType[];

const BILLING_REASON_LABEL: Record<BillingReason, string> = {
	subscription_create: 'Nova assinatura',
	subscription_cycle: 'Renovação',
	subscription_update: 'Atualização',
	manual: 'Manual',
};

const INTERVAL_LABEL: Record<'monthly' | 'yearly', string> = {
	monthly: 'Mensal',
	yearly: 'Anual',
};

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

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Assinatura reembolsável: dentro da janela de 7 dias desde a entrada. */
function isRefundable(row: EntryRow): boolean {
	if (row.entry_type !== 'subscription' || !row.subscription?.subscription_id)
		return false;
	const occurred = new Date(row.occurred_at).getTime();
	return Number.isFinite(occurred) && Date.now() - occurred <= REFUND_WINDOW_MS;
}

export function EntriesSection() {
	const [preset, setPreset] = useState<DatePreset>('30d');
	const [customFrom, setCustomFrom] = useState('');
	const [customTo, setCustomTo] = useState('');
	const [search, setSearch] = useState('');
	const [entryType, setEntryType] = useState<EntryType | ''>('');
	const [page, setPage] = useState(1);
	const [refundTarget, setRefundTarget] = useState<EntryRow | null>(null);

	const range = getRange(preset, customFrom, customTo);

	const listParams: EntriesAnalyticsParams = {
		from: range.from,
		to: range.to,
		...(entryType && { entry_type: entryType }),
		...(search.trim() && { q: search.trim() }),
		page,
		per_page: PER_PAGE,
		sort: 'occurred_at:desc',
	};

	const {
		data: analytics,
		isLoading: listLoading,
		isFetching,
		refetch: refetchList,
	} = useEntriesAnalytics(listParams);

	function handleTypeChip(t: EntryType | '') {
		setEntryType((prev) => (prev === t ? '' : t));
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
			{/* Type filter chips */}
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => handleTypeChip('')}
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
						entryType === ''
							? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
							: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
					}`}
				>
					Todas
				</button>

				{ALL_TYPES.map((t) => {
					const cfg = TYPE_CONFIG[t];
					return (
						<button
							key={t}
							type="button"
							onClick={() => handleTypeChip(t)}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
								entryType === t
									? `${cfg.bg} ${cfg.text} border-current/30`
									: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${entryType === t ? cfg.dot : 'bg-current'}`}
							/>
							{cfg.label}
						</button>
					);
				})}

				<button
					type="button"
					onClick={() => refetchList()}
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
								<th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Tipo
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Detalhe
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Valor
								</th>
								<th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
									Data
								</th>
								<th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
									Ações
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
										Nenhuma entrada encontrada
									</td>
								</tr>
							)}
							{analytics?.data.map((row) => (
								<EntryRowItem
									key={row.id}
									row={row}
									onRefund={() => setRefundTarget(row)}
								/>
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

			{refundTarget?.subscription?.subscription_id && (
				<RefundSubscriptionModal
					subscriptionId={refundTarget.subscription.subscription_id}
					productName={refundTarget.subscription.plan.name}
					customerName={refundTarget.customer.name ?? '—'}
					customerEmail={refundTarget.customer.email}
					amountLabel={formatCents(refundTarget.amount_cents)}
					isOpen={!!refundTarget}
					onClose={() => {
						setRefundTarget(null);
						refetchList();
					}}
				/>
			)}
		</div>
	);
}

// ─── Row ────────────────────────────────────────

function EntryRowItem({
	row,
	onRefund,
}: {
	row: EntryRow;
	onRefund: () => void;
}) {
	const cfg = TYPE_CONFIG[row.entry_type];
	const refundable = isRefundable(row);
	return (
		<tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
			<td className="px-4 py-3">
				<p className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
					{row.customer.name ?? '—'}
				</p>
				<p className="text-xs text-slate-500 dark:text-gray-500 truncate max-w-[180px]">
					{row.customer.email}
				</p>
			</td>
			<td className="px-4 py-3 text-center">
				<span
					className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
				>
					<span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
					{cfg.label}
				</span>
			</td>
			<td className="px-4 py-3">
				{row.entry_type === 'subscription' && row.subscription ? (
					<>
						<p className="text-slate-900 dark:text-white font-medium">
							{row.subscription.plan.name}
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-500">
							{BILLING_REASON_LABEL[row.subscription.billing_reason]} ·{' '}
							{INTERVAL_LABEL[row.subscription.interval]}
						</p>
					</>
				) : row.entry_type === 'vox' && row.vox ? (
					<div className="flex items-center gap-2">
						<VoxxysIcon className="w-4 h-4 text-violet-400 shrink-0" />
						<div>
							<p className="text-slate-900 dark:text-white font-medium">
								{row.vox.package_name ?? `${row.vox.vox_amount} voxxys`}
							</p>
							<p className="text-xs text-slate-500 dark:text-gray-500">
								{row.vox.vox_amount} voxxys
							</p>
						</div>
					</div>
				) : (
					<span className="text-slate-400 dark:text-gray-600 italic text-xs">
						—
					</span>
				)}
			</td>
			<td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
				{formatCents(row.amount_cents)}
			</td>
			<td className="px-4 py-3 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">
				{formatDate(row.occurred_at)}
			</td>
			<td className="px-4 py-3 text-right whitespace-nowrap">
				{refundable ? (
					<button
						type="button"
						onClick={onRefund}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						Reembolsar
					</button>
				) : (
					<span className="text-slate-300 dark:text-gray-700">—</span>
				)}
			</td>
		</tr>
	);
}
