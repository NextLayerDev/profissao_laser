'use client';

import {
	ChevronLeft,
	ChevronRight,
	Gem,
	Loader2,
	Receipt,
	Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { INVOICE_PAGE_SIZE, useCompanyInvoice } from '@/hooks/use-plan-links';

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

export function CompanyInvoiceTab() {
	const [page, setPage] = useState(0);
	const { data, isLoading } = useCompanyInvoice(page);

	if (isLoading && !data) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
			</div>
		);
	}

	const totals = data?.totals;
	const entries = data?.entries ?? [];
	const total = data?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / INVOICE_PAGE_SIZE));

	return (
		<div className="p-4 md:p-6 space-y-6">
			{/* Totais */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-5">
					<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
						<Wallet className="w-4 h-4" />
						Total em aberto
					</div>
					<p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
						{fmtBRL(totals?.open_cents ?? 0)}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
						Custo de plataforma acumulado pelos usos com voxxys doados.
					</p>
				</div>
				<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-5">
					<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
						<Gem className="w-4 h-4" />
						Voxxys doados
					</div>
					<p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
						{(
							(totals?.vox_granted ?? 0) + (totals?.vox_granted_plans ?? 0)
						).toLocaleString('pt-BR')}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
						{(totals?.vox_granted ?? 0).toLocaleString('pt-BR')} via links (por
						uso) · {(totals?.vox_granted_plans ?? 0).toLocaleString('pt-BR')}{' '}
						via planos (no ato).
					</p>
				</div>
				<div className="rounded-2xl border border-violet-300/40 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/[0.06] p-5">
					<div className="flex items-center gap-2 text-violet-600 dark:text-violet-300 text-xs font-medium uppercase tracking-wider">
						<Receipt className="w-4 h-4" />
						Voxxy doado
					</div>
					<p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-300 tabular-nums">
						{fmtBRL(totals?.vox_rate_cents ?? 120)}
						<span className="text-sm font-medium text-violet-500 dark:text-violet-400">
							{' '}
							/voxxy
						</span>
					</p>
					<p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-1">
						Voxxys de PLANO cobram esse valor no ato da doação. Voxxys de LINK
						cobram o custo real de cada ferramenta usada.
					</p>
				</div>
			</div>

			{/* Entries */}
			{entries.length === 0 ? (
				<div className="text-center py-16">
					<Receipt className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhum lançamento ainda
					</p>
					<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
						Quando clientes de links usarem ferramentas consumindo os voxxys
						doados, o custo aparece aqui.
					</p>
				</div>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/8">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-white/[0.02]">
								{['Data', 'Cliente', 'Origem', 'Voxxys', 'Custo'].map((h) => (
									<th
										key={h}
										className="text-left py-3 px-4 font-medium text-slate-400 dark:text-gray-600"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{entries.map((entry) => (
								<tr
									key={entry.id}
									className="border-b border-slate-100 dark:border-gray-800/50"
								>
									<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs">
										{formatDate(entry.created_at)}
									</td>
									<td className="py-3 px-4 text-slate-900 dark:text-white">
										{entry.customer_name ?? entry.customer_email ?? '—'}
									</td>
									<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
										{entry.source === 'plan_grant' ? (
											<span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/25">
												<Gem className="w-3 h-3" />
												Voxxys do plano
												{entry.plan_name ? ` ${entry.plan_name}` : ''}
											</span>
										) : (
											(entry.tool_name ?? entry.tool_key ?? '—')
										)}
									</td>
									<td className="py-3 px-4 text-slate-600 dark:text-gray-400 tabular-nums">
										{entry.voxes_spent.toLocaleString('pt-BR')}
									</td>
									<td
										className={`py-3 px-4 font-semibold tabular-nums ${
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
							))}
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
