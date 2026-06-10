'use client';

import {
	BadgeCheck,
	ChevronLeft,
	ChevronRight,
	Clock,
	Loader2,
	TicketPercent,
	Users,
} from 'lucide-react';
import { useState } from 'react';
import {
	INVOICE_PAGE_SIZE,
	usePlanLinkRedemptions,
} from '@/hooks/use-plan-links';

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

function formatCpf(cpf: string): string {
	const digits = cpf.replace(/\D/g, '');
	if (digits.length !== 11) return cpf;
	return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Assinantes que entraram pelos links especiais (mensais e anuais). */
export function LinkSubscribersTable() {
	const [page, setPage] = useState(0);
	const { data, isLoading } = usePlanLinkRedemptions(page);

	if (isLoading && !data) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
			</div>
		);
	}

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / INVOICE_PAGE_SIZE));

	const completed = rows.filter((r) => r.status === 'completed');
	const pending = rows.filter((r) => r.status === 'pending');
	const discountTotal = completed.reduce(
		(sum, r) => sum + r.amount_off_cents,
		0,
	);

	if (total === 0) {
		return (
			<div className="text-center py-20">
				<Users className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
				<p className="text-slate-600 dark:text-gray-400 font-medium">
					Ninguém assinou pelos links ainda
				</p>
				<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
					Quando alguém resgatar um link especial, aparece aqui.
				</p>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-6 space-y-6">
			{/* Resumo (da página atual — espelho do que está listado abaixo) */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-5">
					<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
						<BadgeCheck className="w-4 h-4" />
						Assinaram
					</div>
					<p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
						{completed.length}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
						Resgates completados nesta página ({total} no total).
					</p>
				</div>
				<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-5">
					<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
						<Clock className="w-4 h-4" />
						Pendentes
					</div>
					<p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
						{pending.length}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
						Abriram o checkout e ainda não pagaram.
					</p>
				</div>
				<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-5">
					<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
						<TicketPercent className="w-4 h-4" />
						Desconto concedido
					</div>
					<p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
						{fmtBRL(discountTotal)}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
						Soma dos cupons dos resgates completados (página atual).
					</p>
				</div>
			</div>

			{/* Tabela */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-slate-200 dark:border-gray-800">
							{[
								'Cliente',
								'CPF',
								'Plano',
								'Tipo',
								'Pagou 1º período',
								'Desconto',
								'Voxxys',
								'Status',
								'Data',
							].map((h) => (
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
						{rows.map((r) => (
							<tr
								key={r.id}
								className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-[#1a1a1d]/50 transition-colors"
							>
								<td className="py-3 px-4">
									<p className="font-medium text-slate-900 dark:text-white">
										{r.customer_name ?? '—'}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-500">
										{r.customer_email ?? '—'}
									</p>
								</td>
								<td className="py-3 px-4">
									<code className="text-xs text-slate-600 dark:text-gray-400">
										{formatCpf(r.cpf)}
									</code>
								</td>
								<td className="py-3 px-4 text-slate-700 dark:text-gray-300">
									{r.plan_name ?? r.plan_key ?? '—'}
								</td>
								<td className="py-3 px-4">
									{r.link_kind === 'annual_fixed' ? (
										<span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-violet-500/10 text-violet-500 dark:text-violet-300 border-violet-500/20">
											Anual
										</span>
									) : (
										<span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-sky-500/10 text-sky-500 dark:text-sky-300 border-sky-500/20">
											Mensal
										</span>
									)}
								</td>
								<td className="py-3 px-4 font-medium text-slate-900 dark:text-white tabular-nums">
									{fmtBRL(r.floor_cents)}
								</td>
								<td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 tabular-nums">
									−{fmtBRL(r.amount_off_cents)}
								</td>
								<td className="py-3 px-4 text-slate-700 dark:text-gray-300 tabular-nums">
									{r.vox_grant > 0 ? (
										<>
											<span className="font-medium text-violet-500 dark:text-violet-400">
												{r.vox_grant_remaining}
											</span>
											<span className="text-slate-400 dark:text-gray-500">
												/{r.vox_grant} restantes
											</span>
										</>
									) : (
										'—'
									)}
								</td>
								<td className="py-3 px-4">
									{r.status === 'completed' ? (
										<span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20">
											Assinou
										</span>
									) : (
										<span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20">
											Pendente
										</span>
									)}
								</td>
								<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs">
									{formatDate(r.completed_at ?? r.created_at)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Paginação */}
			{pageCount > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-slate-500 dark:text-gray-500">
						Página {page + 1} de {pageCount} — {total} resgates
					</p>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setPage((p) => Math.max(0, p - 1))}
							disabled={page === 0}
							className="p-2 rounded-lg border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-[#1a1a1d] transition-colors disabled:opacity-40"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
							disabled={page >= pageCount - 1}
							className="p-2 rounded-lg border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-[#1a1a1d] transition-colors disabled:opacity-40"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
