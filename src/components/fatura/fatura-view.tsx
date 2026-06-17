'use client';

import {
	Boxes,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Coins,
	FileSpreadsheet,
	FileText,
	Gem,
	Link2,
	Loader2,
	type LucideIcon,
	Percent,
	PiggyBank,
	Receipt,
	Search,
	TrendingUp,
	Users,
	Wallet,
	Wrench,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	INVOICE_PAGE_SIZE,
	type InvoiceFilters,
	useCompanyInvoice,
} from '@/hooks/use-plan-links';
import { getCompanyInvoice } from '@/services/plan-links';
import type { CompanyInvoiceSource, VoxxyLastro } from '@/types/plan-link';
import {
	exportFinanceiroExcel,
	exportFinanceiroPdf,
} from '@/utils/export-financeiro';

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

const MONTHS_PT = [
	'Jan',
	'Fev',
	'Mar',
	'Abr',
	'Mai',
	'Jun',
	'Jul',
	'Ago',
	'Set',
	'Out',
	'Nov',
	'Dez',
];

/** 'YYYY-MM' → 'Jun/2026'. */
function fmtMonth(ym: string): string {
	const [y, m] = ym.split('-').map(Number);
	return `${MONTHS_PT[(m ?? 1) - 1] ?? '—'}/${y ?? ''}`;
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

/* ── cards do topo (financeiro) ─────────────────────────────────────────── */

function HeroStat({
	Icon,
	label,
	value,
	hint,
	tone,
	badge,
}: {
	Icon: LucideIcon;
	label: string;
	value: string;
	hint: string;
	tone: 'sky' | 'primary' | 'emerald';
	badge?: string;
}) {
	const tones: Record<typeof tone, string> = {
		sky: 'border-sky-300/50 dark:border-sky-500/25 bg-sky-50 dark:bg-sky-500/[0.07]',
		primary:
			'border-violet-300/50 dark:border-violet-500/25 bg-violet-50 dark:bg-violet-500/[0.07]',
		emerald:
			'border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/[0.09]',
	};
	const iconTones: Record<typeof tone, string> = {
		sky: 'text-sky-600 dark:text-sky-300',
		primary: 'text-violet-600 dark:text-violet-300',
		emerald: 'text-emerald-600 dark:text-emerald-400',
	};
	return (
		<div className={`rounded-2xl border p-5 ${tones[tone]}`}>
			<div className="flex items-center justify-between">
				<div
					className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${iconTones[tone]}`}
				>
					<Icon className="w-4 h-4" />
					{label}
				</div>
				{badge && (
					<span
						className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/20 ${iconTones[tone]}`}
					>
						{badge}
					</span>
				)}
			</div>
			<p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
				{value}
			</p>
			<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{hint}</p>
		</div>
	);
}

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
	tone: 'emerald' | 'amber' | 'slate' | 'violet' | 'teal';
}) {
	const tones: Record<typeof tone, string> = {
		emerald:
			'border-emerald-300/40 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.05]',
		amber:
			'border-amber-300/40 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.05]',
		slate: 'border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03]',
		violet:
			'border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03]',
		teal: 'border-teal-300/40 dark:border-teal-500/20 bg-teal-50/60 dark:bg-teal-500/[0.05]',
	};
	const iconTones: Record<typeof tone, string> = {
		emerald: 'text-emerald-600 dark:text-emerald-400',
		amber: 'text-amber-600 dark:text-amber-400',
		slate: 'text-slate-500 dark:text-gray-400',
		violet: 'text-violet-500 dark:text-violet-400',
		teal: 'text-teal-600 dark:text-teal-400',
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

type BarSeg = { label: string; cents: number; color: string };

/** Barra horizontal: bruta dividida em repasse (por origem) + líquido. */
function CompositionBar({
	gross,
	segments,
}: {
	gross: number;
	segments: BarSeg[];
}) {
	if (gross <= 0) return null;
	const pct = (c: number) => `${Math.max(0, (c / gross) * 100)}%`;
	return (
		<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-5">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
					De onde vem, pra onde vai
				</h3>
				<span className="text-xs text-slate-500 dark:text-gray-500">
					Receita bruta {fmtBRL(gross)}
				</span>
			</div>
			<div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
				{segments.map((s) =>
					s.cents > 0 ? (
						<div
							key={s.label}
							className={s.color}
							style={{ width: pct(s.cents) }}
							title={`${s.label}: ${fmtBRL(s.cents)}`}
						/>
					) : null,
				)}
			</div>
			<div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
				{segments.map((s) => (
					<span
						key={s.label}
						className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400"
					>
						<span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
						{s.label}
						<strong className="text-slate-800 dark:text-gray-200 tabular-nums">
							{fmtBRL(s.cents)}
						</strong>
						<span className="text-slate-400 dark:text-gray-600 tabular-nums">
							({((s.cents / gross) * 100).toFixed(0)}%)
						</span>
					</span>
				))}
			</div>
		</div>
	);
}

/* ── aba Lastro de Voxxys ────────────────────────────────────────────────── */

function LastroVoxxysSection({ voxxy }: { voxxy: VoxxyLastro | undefined }) {
	const sold = voxxy?.sold_cents ?? 0;
	const used = voxxy?.used_value_cents ?? 0;
	const lastro = voxxy?.lastro_cents ?? 0;
	const upvox = voxxy?.upvox_share_cents ?? 0;
	const company = voxxy?.company_share_cents ?? 0;
	const perCustomer = voxxy?.per_customer ?? [];

	return (
		<div className="space-y-6">
			{/* Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<HeroStat
					tone="emerald"
					Icon={PiggyBank}
					label="Ganho da empresa"
					value={fmtBRL(company)}
					hint="50% dos voxxys comprados que já foram usados."
				/>
				<HeroStat
					tone="sky"
					Icon={Boxes}
					label="Lastro (não usados)"
					value={fmtBRL(lastro)}
					hint="Voxxys comprados ainda não usados (reserva)."
				/>
				<HeroStat
					tone="primary"
					Icon={Coins}
					label="Usados (valor)"
					value={fmtBRL(used)}
					hint={`Split: upvox ${fmtBRL(upvox)} · empresa ${fmtBRL(company)}.`}
				/>
				<HeroStat
					tone="sky"
					Icon={TrendingUp}
					label="Vendido"
					value={fmtBRL(sold)}
					hint="Total arrecadado em pacotes de voxxys."
				/>
			</div>

			<p className="text-xs text-slate-500 dark:text-gray-500">
				Só voxxys <strong>comprados</strong> em pacote. Não inclui voxxys doados
				por plano (cobrados R$1,20 no ato) nem por link (custo na Fatura upvox).
			</p>

			{/* Por cliente */}
			<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-5">
				<div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700 dark:text-gray-300">
					<Users className="w-4 h-4 text-slate-400 dark:text-gray-500" />
					Por cliente
				</div>
				{perCustomer.length === 0 ? (
					<p className="text-sm text-slate-500 dark:text-gray-600">
						Nenhuma compra de voxxys no período.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs text-slate-400 dark:text-gray-600">
									<th className="font-medium pb-2">Cliente</th>
									<th className="font-medium pb-2 text-right">Comprou</th>
									<th className="font-medium pb-2 text-right">Usou</th>
									<th className="font-medium pb-2 text-right">Lastro</th>
									<th className="font-medium pb-2 text-right">Ganho</th>
								</tr>
							</thead>
							<tbody>
								{perCustomer.map((c) => (
									<tr
										key={c.customer_id}
										className="border-t border-slate-100 dark:border-gray-800/50"
									>
										<td className="py-2 text-slate-800 dark:text-gray-200 truncate max-w-[220px]">
											{c.customer_name ?? c.customer_email ?? '—'}
										</td>
										<td className="py-2 text-right tabular-nums text-slate-600 dark:text-gray-400">
											{fmtBRL(c.sold_cents)}
										</td>
										<td className="py-2 text-right tabular-nums text-slate-600 dark:text-gray-400">
											{fmtBRL(c.used_value_cents)}
										</td>
										<td className="py-2 text-right tabular-nums text-sky-600 dark:text-sky-400">
											{fmtBRL(c.lastro_cents)}
										</td>
										<td className="py-2 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
											{fmtBRL(c.company_share_cents)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

const FINANCE_TABS = [
	{ key: 'financeiro' as const, label: 'Financeiro', Icon: Wallet },
	{ key: 'lastro' as const, label: 'Lastro Voxxys', Icon: Coins },
];

export function FaturaView() {
	const [tab, setTab] = useState<'financeiro' | 'lastro'>('financeiro');
	const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
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
	const monthly = data?.monthly ?? [];
	const topCustomers = data?.top_customers ?? [];
	const voxxy = data?.voxxy_lastro;
	const total = data?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / INVOICE_PAGE_SIZE));
	const hasFilters = !!(source || from || to || q);

	// Financeiro: bruta (alunos) − líquido (empresa) = repasse (upvox). O repasse
	// aqui é o TOTAL (reconcilia bruta = repasse + líquido), independe da origem.
	const grossCents = totals?.gross_revenue_cents ?? 0;
	const netCents = totals?.company_net_cents ?? 0;
	const repasseCents =
		grossCents > 0 ? grossCents - netCents : (totals?.open_cents ?? 0);
	const marginPct = grossCents > 0 ? (netCents / grossCents) * 100 : 0;

	const barSegments: BarSeg[] = [
		{
			label: 'Voxxys do plano',
			cents: totals?.plan_grants_cents ?? 0,
			color: 'bg-violet-500',
		},
		{
			label: 'Links (100%)',
			cents: totals?.link_purchases_cents ?? 0,
			color: 'bg-amber-500',
		},
		{
			label: 'Assinaturas (3,5%)',
			cents: totals?.subscription_fees_cents ?? 0,
			color: 'bg-sky-500',
		},
		{
			label: 'Ferramentas',
			cents: totals?.tools_cents ?? 0,
			color: 'bg-slate-400',
		},
		{
			label: 'Voxxy comprado (50%)',
			cents: totals?.vox_purchase_use_cents ?? 0,
			color: 'bg-teal-500',
		},
		{ label: 'Líquido da empresa', cents: netCents, color: 'bg-emerald-500' },
	];

	const clearFilters = () => {
		setSource('');
		setFrom('');
		setTo('');
		setQInput('');
		setQ('');
	};

	// Exporta o financeiro completo (totais, mensal, top, lastro e extrato) com os
	// filtros atuais. Busca todas as entries (não só a página) e gera o arquivo.
	async function handleExport(kind: 'pdf' | 'excel') {
		if (exporting) return;
		setExporting(kind);
		try {
			const inv = await getCompanyInvoice({
				limit: 200,
				offset: 0,
				...filters,
			});
			const meta = {
				from: from || undefined,
				to: to || undefined,
				source: source || undefined,
				q: q || undefined,
				generatedAt: new Date().toLocaleString('pt-BR'),
			};
			if (kind === 'excel') await exportFinanceiroExcel(inv, meta);
			else await exportFinanceiroPdf(inv, meta);
		} catch {
			toast.error('Não foi possível gerar o arquivo.');
		} finally {
			setExporting(null);
		}
	}

	return (
		<div className="space-y-6">
			{/* Abas + exportar */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-2xl p-1 w-fit">
					{FINANCE_TABS.map((t) => (
						<button
							key={t.key}
							type="button"
							onClick={() => setTab(t.key)}
							className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
								tab === t.key
									? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
									: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
							}`}
						>
							<t.Icon className="w-4 h-4" />
							{t.label}
						</button>
					))}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => handleExport('excel')}
						disabled={!!exporting || !data}
						className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
					>
						{exporting === 'excel' ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
						)}
						Excel
					</button>
					<button
						type="button"
						onClick={() => handleExport('pdf')}
						disabled={!!exporting || !data}
						className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
					>
						{exporting === 'pdf' ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
						)}
						PDF
					</button>
				</div>
			</div>

			{tab === 'lastro' ? (
				<LastroVoxxysSection voxxy={voxxy} />
			) : (
				<div className="space-y-6">
					{/* Topo financeiro: bruta → fatura upvox → líquido */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<HeroStat
							tone="sky"
							Icon={TrendingUp}
							label="Receita bruta"
							value={fmtBRL(grossCents)}
							hint="Total que os alunos pagaram no período."
						/>
						<HeroStat
							tone="primary"
							Icon={Wallet}
							label="Fatura upvox"
							value={fmtBRL(repasseCents)}
							hint="O que a empresa repassa à plataforma."
						/>
						<HeroStat
							tone="emerald"
							Icon={PiggyBank}
							label="Líquido da empresa"
							value={fmtBRL(netCents)}
							hint="Quanto sobra pra empresa do curso."
							badge={
								grossCents > 0
									? `margem ${marginPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
									: undefined
							}
						/>
					</div>

					{/* Barra de composição (bruta → repasse por origem + líquido) */}
					<CompositionBar gross={grossCents} segments={barSegments} />

					{/* Composição do repasse — quebra por origem */}
					<div>
						<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
							Composição do repasse à upvox
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
							<SummaryCard
								tone="violet"
								Icon={Gem}
								label="Voxxys do plano"
								value={fmtBRL(totals?.plan_grants_cents ?? 0)}
								hint={`${(totals?.vox_granted_plans ?? 0).toLocaleString('pt-BR')} voxxys × ${fmtBRL(totals?.vox_rate_cents ?? 120)}`}
							/>
							<SummaryCard
								tone="amber"
								Icon={Link2}
								label="Compras via link"
								value={fmtBRL(totals?.link_purchases_cents ?? 0)}
								hint="100% do 1º período de cada link."
							/>
							<SummaryCard
								tone="emerald"
								Icon={Percent}
								label="Assinaturas (3,5%)"
								value={fmtBRL(totals?.subscription_fees_cents ?? 0)}
								hint="3,5% de cada pagamento de assinatura."
							/>
							<SummaryCard
								tone="slate"
								Icon={Wrench}
								label="Ferramentas"
								value={fmtBRL(totals?.tools_cents ?? 0)}
								hint="Custo de plataforma por uso de tools."
							/>
							<SummaryCard
								tone="teal"
								Icon={Coins}
								label="Voxxy comprado (50%)"
								value={fmtBRL(totals?.vox_purchase_use_cents ?? 0)}
								hint="50% da upvox sobre voxxy comprado usado."
							/>
						</div>
					</div>

					{/* Levantamentos: por mês + top clientes */}
					{(monthly.length > 0 || topCustomers.length > 0) && (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{/* Resumo por mês */}
							<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-5">
								<div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700 dark:text-gray-300">
									<CalendarDays className="w-4 h-4 text-slate-400 dark:text-gray-500" />
									Resumo por mês
								</div>
								{monthly.length === 0 ? (
									<p className="text-sm text-slate-500 dark:text-gray-600">
										Sem dados no período.
									</p>
								) : (
									<table className="w-full text-sm">
										<thead>
											<tr className="text-left text-xs text-slate-400 dark:text-gray-600">
												<th className="font-medium pb-2">Mês</th>
												<th className="font-medium pb-2 text-right">Bruta</th>
												<th className="font-medium pb-2 text-right">Repasse</th>
												<th className="font-medium pb-2 text-right">Líquido</th>
											</tr>
										</thead>
										<tbody>
											{monthly.map((m) => (
												<tr
													key={m.month}
													className="border-t border-slate-100 dark:border-gray-800/50"
												>
													<td className="py-2 text-slate-700 dark:text-gray-300 whitespace-nowrap">
														{fmtMonth(m.month)}
													</td>
													<td className="py-2 text-right tabular-nums text-slate-600 dark:text-gray-400">
														{fmtBRL(m.gross_cents)}
													</td>
													<td className="py-2 text-right tabular-nums text-violet-600 dark:text-violet-400">
														{fmtBRL(m.repasse_cents)}
													</td>
													<td className="py-2 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
														{fmtBRL(m.net_cents)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								)}
							</div>

							{/* Top clientes */}
							<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-5">
								<div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700 dark:text-gray-300">
									<Users className="w-4 h-4 text-slate-400 dark:text-gray-500" />
									Top clientes por receita
								</div>
								{topCustomers.length === 0 ? (
									<p className="text-sm text-slate-500 dark:text-gray-600">
										Sem dados no período.
									</p>
								) : (
									<ul className="space-y-2">
										{topCustomers.map((c, i) => (
											<li
												key={c.customer_id}
												className="flex items-center gap-3 py-1"
											>
												<span className="w-5 text-xs font-bold text-slate-400 dark:text-gray-600 tabular-nums">
													{i + 1}
												</span>
												<div className="min-w-0 flex-1">
													<p className="text-sm text-slate-800 dark:text-gray-200 truncate">
														{c.customer_name ?? c.customer_email ?? '—'}
													</p>
													<p className="text-xs text-slate-400 dark:text-gray-600">
														repasse {fmtBRL(c.repasse_cents)} · líquido{' '}
														{fmtBRL(c.net_cents)}
													</p>
												</div>
												<span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
													{fmtBRL(c.gross_cents)}
												</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					)}

					{/* Extrato detalhado */}
					<div>
						<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
							Extrato detalhado
						</h3>

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
							<div className="text-center py-16 rounded-2xl border border-slate-200 dark:border-white/8 mt-4">
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
							<div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/8 mt-4">
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
							<div className="flex items-center justify-between mt-4">
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
				</div>
			)}
		</div>
	);
}
