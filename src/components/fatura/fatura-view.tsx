'use client';

import {
	ChevronLeft,
	ChevronRight,
	Gem,
	Link2,
	Loader2,
	type LucideIcon,
	Percent,
	Receipt,
	Search,
	Wallet,
	Wrench,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
	INVOICE_PAGE_SIZE,
	type InvoiceFilters,
	useCompanyInvoice,
} from '@/hooks/use-plan-links';
import type { CompanyInvoiceSource } from '@/types/plan-link';

function fmtBRL(cents: number): string {
	return (cents / 100).toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/** Taxa em basis points → texto (350 → "3,5%"; 10000 → "100%"). */
function fmtRate(bps: number | null | undefined): string | null {
	if (bps == null) return null;
	return `${(bps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

type SourceMeta = {
	label: string;
	Icon: LucideIcon;
	/** classes do badge (texto/borda/fundo). */
	badge: string;
};

const SOURCE_META: Record<CompanyInvoiceSource, SourceMeta> = {
	subscription_fee: {
		label: 'Taxa de assinatura',
		Icon: Percent,
		badge:
			'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25',
	},
	link_purchase: {
		label: 'Compra via link',
		Icon: Link2,
		badge:
			'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25',
	},
	plan_grant: {
		label: 'Voxxys do plano',
		Icon: Gem,
		badge:
			'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/25',
	},
	link_tool_use: {
		label: 'Uso de ferramenta',
		Icon: Wrench,
		badge:
			'bg-slate-500/10 text-slate-600 dark:text-gray-300 border-slate-400/25',
	},
};

const SOURCE_OPTIONS: { value: CompanyInvoiceSource; label: string }[] = [
	{ value: 'subscription_fee', label: 'Taxa de assinatura (3,5%)' },
	{ value: 'link_purchase', label: 'Compra via link (100%)' },
	{ value: 'link_tool_use', label: 'Uso de ferramenta' },
	{ value: 'plan_grant', label: 'Voxxys do plano' },
];

function SummaryCard({
	Icon,
	label,
	value,
	hint,
	tone,
}: {
	Icon: LucideIcon;
	label: string;
	value: string;
	hint: string;
	tone: 'primary' | 'emerald' | 'amber' | 'slate' | 'violet';
}) {
	const tones: Record<typeof tone, string> = {
		primary:
			'border-violet-300/50 dark:border-violet-500/25 bg-violet-50 dark:bg-violet-500/[0.07]',
		emerald:
			'border-emerald-300/40 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.05]',
		amber:
			'border-amber-300/40 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.05]',
		slate: 'border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03]',
		violet:
			'border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03]',
	};
	const iconTones: Record<typeof tone, string> = {
		primary: 'text-violet-600 dark:text-violet-300',
		emerald: 'text-emerald-600 dark:text-emerald-400',
		amber: 'text-amber-600 dark:text-amber-400',
		slate: 'text-slate-500 dark:text-gray-400',
		violet: 'text-violet-500 dark:text-violet-400',
	};
	return (
		<div className={`rounded-2xl border p-5 ${tones[tone]}`}>
			<div
				className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${iconTones[tone]}`}
			>
				<Icon className="w-4 h-4" />
				{label}
			</div>
			<p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
				{value}
			</p>
			<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{hint}</p>
		</div>
	);
}

export function FaturaView() {
	const [page, setPage] = useState(0);
	const [source, setSource] = useState<CompanyInvoiceSource | ''>('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [qInput, setQInput] = useState('');
	const [q, setQ] = useState('');

	// Debounce da busca por cliente (não refaz a request a cada tecla).
	useEffect(() => {
		const id = setTimeout(() => setQ(qInput.trim()), 400);
		return () => clearTimeout(id);
	}, [qInput]);

	const filters: InvoiceFilters = useMemo(
		() => ({
			source: source || undefined,
			from: from || undefined,
			// `to` cobre o dia inteiro (até 23:59:59).
			to: to ? `${to}T23:59:59` : undefined,
			q: q || undefined,
		}),
		[source, from, to, q],
	);

	// Qualquer mudança de filtro volta pra 1ª página.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on filter change
	useEffect(() => {
		setPage(0);
	}, [filters]);

	const { data, isLoading, isFetching } = useCompanyInvoice(page, filters);

	const totals = data?.totals;
	const entries = data?.entries ?? [];
	const total = data?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / INVOICE_PAGE_SIZE));
	const hasFilters = !!(source || from || to || q);

	const clearFilters = () => {
		setSource('');
		setFrom('');
		setTo('');
		setQInput('');
		setQ('');
	};

	return (
		<div className="space-y-6">
			{/* Cards de resumo */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				<SummaryCard
					tone="primary"
					Icon={Wallet}
					label="Total em aberto"
					value={fmtBRL(totals?.open_cents ?? 0)}
					hint="Tudo que a empresa deve à plataforma."
				/>
				<SummaryCard
					tone="emerald"
					Icon={Percent}
					label="Assinaturas (3,5%)"
					value={fmtBRL(totals?.subscription_fees_cents ?? 0)}
					hint="3,5% de cada pagamento de assinatura."
				/>
				<SummaryCard
					tone="amber"
					Icon={Link2}
					label="Compras via link"
					value={fmtBRL(totals?.link_purchases_cents ?? 0)}
					hint="100% do 1º período de cada link."
				/>
				<SummaryCard
					tone="slate"
					Icon={Wrench}
					label="Ferramentas"
					value={fmtBRL(totals?.tools_cents ?? 0)}
					hint="Custo de plataforma por uso de tools."
				/>
				<SummaryCard
					tone="violet"
					Icon={Gem}
					label="Voxxys do plano"
					value={fmtBRL(totals?.plan_grants_cents ?? 0)}
					hint={`${(totals?.vox_granted_plans ?? 0).toLocaleString('pt-BR')} voxxys × ${fmtBRL(totals?.vox_rate_cents ?? 120)}`}
				/>
			</div>

			{/* Filtros */}
			<div className="flex flex-wrap items-end gap-3">
				<div className="flex flex-col gap-1">
					<label
						htmlFor="fatura-source"
						className="text-xs font-medium text-slate-500 dark:text-gray-500"
					>
						Origem
					</label>
					<select
						id="fatura-source"
						value={source}
						onChange={(e) =>
							setSource(e.target.value as CompanyInvoiceSource | '')
						}
						className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-3 text-sm text-slate-900 dark:text-white"
					>
						<option value="">Todas</option>
						{SOURCE_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</div>
				<div className="flex flex-col gap-1">
					<label
						htmlFor="fatura-from"
						className="text-xs font-medium text-slate-500 dark:text-gray-500"
					>
						De
					</label>
					<input
						id="fatura-from"
						type="date"
						value={from}
						onChange={(e) => setFrom(e.target.value)}
						className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-3 text-sm text-slate-900 dark:text-white"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label
						htmlFor="fatura-to"
						className="text-xs font-medium text-slate-500 dark:text-gray-500"
					>
						Até
					</label>
					<input
						id="fatura-to"
						type="date"
						value={to}
						onChange={(e) => setTo(e.target.value)}
						className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-3 text-sm text-slate-900 dark:text-white"
					/>
				</div>
				<div className="flex flex-col gap-1 flex-1 min-w-[200px]">
					<label
						htmlFor="fatura-q"
						className="text-xs font-medium text-slate-500 dark:text-gray-500"
					>
						Cliente
					</label>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-600" />
						<input
							id="fatura-q"
							value={qInput}
							onChange={(e) => setQInput(e.target.value)}
							placeholder="Nome ou email…"
							className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] pl-9 pr-3 text-sm text-slate-900 dark:text-white"
						/>
					</div>
				</div>
				{hasFilters && (
					<button
						type="button"
						onClick={clearFilters}
						className="h-10 flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
					>
						<X className="w-4 h-4" />
						Limpar
					</button>
				)}
				{isFetching && (
					<Loader2 className="w-4 h-4 text-violet-500 animate-spin mb-3" />
				)}
			</div>

			{/* Tabela */}
			{isLoading && !data ? (
				<div className="flex items-center justify-center py-20">
					<Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
				</div>
			) : entries.length === 0 ? (
				<div className="text-center py-16 rounded-2xl border border-slate-200 dark:border-white/8">
					<Receipt className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhum lançamento
					</p>
					<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
						{hasFilters
							? 'Nenhum lançamento bate com os filtros.'
							: 'Assinaturas, compras por link e usos de ferramenta aparecem aqui.'}
					</p>
				</div>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/8">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-white/[0.02]">
								{[
									'Data',
									'Cliente',
									'Origem',
									'Base',
									'Taxa',
									'Voxxys',
									'Valor',
								].map((h) => (
									<th
										key={h}
										className="text-left py-3 px-4 font-medium text-slate-400 dark:text-gray-600 whitespace-nowrap"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{entries.map((entry) => {
								const meta = SOURCE_META[entry.source];
								const rate = fmtRate(entry.rate_bps);
								// Uso de ferramenta vem agrupado por cliente: mostra o nº de usos.
								const detail =
									entry.source === 'link_tool_use'
										? `${entry.count} uso${entry.count > 1 ? 's' : ''} de ferramenta`
										: entry.plan_name;
								return (
									<tr
										key={entry.id}
										className="border-b border-slate-100 dark:border-gray-800/50"
									>
										<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs whitespace-nowrap">
											{formatDate(entry.created_at)}
										</td>
										<td className="py-3 px-4 text-slate-900 dark:text-white">
											{entry.customer_name ?? entry.customer_email ?? '—'}
										</td>
										<td className="py-3 px-4">
											<span
												className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${meta.badge}`}
											>
												<meta.Icon className="w-3 h-3" />
												{meta.label}
											</span>
											{detail && (
												<span className="block text-xs text-slate-400 dark:text-gray-600 mt-1">
													{detail}
												</span>
											)}
										</td>
										<td className="py-3 px-4 text-slate-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
											{entry.base_amount_cents != null
												? fmtBRL(entry.base_amount_cents)
												: '—'}
										</td>
										<td className="py-3 px-4 text-slate-500 dark:text-gray-400 tabular-nums">
											{rate ?? '—'}
										</td>
										<td className="py-3 px-4 text-slate-500 dark:text-gray-400 tabular-nums">
											{entry.voxes_spent
												? entry.voxes_spent.toLocaleString('pt-BR')
												: '—'}
										</td>
										<td
											className={`py-3 px-4 font-semibold tabular-nums whitespace-nowrap ${
												entry.amount_cents < 0
													? 'text-red-500 dark:text-red-400'
													: 'text-slate-900 dark:text-white'
											}`}
										>
											{entry.amount_cents < 0 && (
												<span className="text-[10px] font-bold uppercase tracking-wider mr-1.5 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
													estorno
												</span>
											)}
											{fmtBRL(entry.amount_cents)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Paginação */}
			{pageCount > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-slate-500 dark:text-gray-500">
						{total} lançamento{total === 1 ? '' : 's'}
					</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							disabled={page === 0}
							onClick={() => setPage((p) => Math.max(0, p - 1))}
							className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 disabled:opacity-40"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span className="text-sm text-slate-600 dark:text-gray-400 tabular-nums">
							{page + 1}/{pageCount}
						</span>
						<button
							type="button"
							disabled={page + 1 >= pageCount}
							onClick={() => setPage((p) => p + 1)}
							className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 disabled:opacity-40"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
