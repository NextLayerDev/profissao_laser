'use client';

import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RecurringSubscription } from '@/types/sales';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { toTitleCase } from '@/utils/title-case';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
	active: {
		label: 'Ativo',
		color: 'bg-green-500/10 text-green-400 border-green-500/20',
	},
	trialing: {
		label: 'Trial',
		color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
	},
	past_due: {
		label: 'Atrasado',
		color: 'bg-red-500/10 text-red-400 border-red-500/20',
	},
	canceled: {
		label: 'Cancelado',
		color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
	},
};

const INTERVAL_LABELS: Record<string, string> = {
	day: 'dia',
	week: 'semana',
	month: 'mês',
	year: 'ano',
};

interface Props {
	subscriptions: RecurringSubscription[];
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
}

export function RecurringTable({
	subscriptions,
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
}: Props) {
	const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<div>
			<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
								<th className="px-4 py-3 font-medium">Cliente</th>
								<th className="px-4 py-3 font-medium hidden md:table-cell">
									E-mail
								</th>
								<th className="px-4 py-3 font-medium hidden lg:table-cell">
									Produto
								</th>
								<th className="px-4 py-3 font-medium">Valor</th>
								<th className="px-4 py-3 font-medium hidden sm:table-cell">
									Status
								</th>
								<th className="px-4 py-3 font-medium">Próxima cobrança</th>
							</tr>
						</thead>
						<tbody>
							{subscriptions.length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
									>
										Nenhuma assinatura recorrente encontrada.
									</td>
								</tr>
							)}
							{subscriptions.map((sub) => {
								const statusInfo = STATUS_LABELS[sub.status] ?? {
									label: sub.status,
									color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
								};
								const intervalLabel =
									sub.intervalCount === 1
										? `por ${INTERVAL_LABELS[sub.interval] ?? sub.interval}`
										: `a cada ${sub.intervalCount} ${INTERVAL_LABELS[sub.interval] ?? sub.interval}s`;

								return (
									<tr
										key={sub.id}
										className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
									>
										{/* Cliente */}
										<td className="px-4 py-3">
											<span className="font-medium text-slate-900 dark:text-white">
												{toTitleCase(sub.customer.name)}
											</span>
											{sub.customer.phone && (
												<span className="block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
													{sub.customer.phone}
												</span>
											)}
											{/* Mobile: email below name */}
											<span className="md:hidden block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
												{sub.customer.email}
											</span>
										</td>

										{/* E-mail */}
										<td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-gray-400">
											{sub.customer.email}
										</td>

										{/* Produto */}
										<td className="px-4 py-3 hidden lg:table-cell">
											<span
												className="block max-w-[200px] truncate text-slate-900 dark:text-white"
												title={sub.product}
											>
												{sub.product}
											</span>
										</td>

										{/* Valor */}
										<td className="px-4 py-3 tabular-nums text-slate-900 dark:text-white">
											<span className="font-medium">
												{formatCurrency(sub.amount, sub.currency.toUpperCase())}
											</span>
											<span className="block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
												{intervalLabel}
											</span>
										</td>

										{/* Status */}
										<td className="px-4 py-3 hidden sm:table-cell">
											<span
												className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
											>
												{statusInfo.label}
											</span>
										</td>

										{/* Próxima cobrança */}
										<td className="px-4 py-3">
											{sub.cancelAtPeriodEnd ? (
												<span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-medium">
													<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
													Cancela em {formatDate(sub.nextChargeAt)}
												</span>
											) : (
												<span className="text-slate-700 dark:text-gray-300 tabular-nums text-sm">
													{formatDate(sub.nextChargeAt)}
												</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{totalItems > 0 && (
				<div className="flex items-center justify-between gap-4 mt-4 px-1">
					<span className="text-sm text-slate-500 dark:text-gray-500">
						Exibindo {startItem}–{endItem} de {totalItems} assinaturas
					</span>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => onPageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className="p-1.5 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span className="px-3 py-1 text-sm text-slate-700 dark:text-gray-300">
							{currentPage} / {totalPages}
						</span>
						<button
							type="button"
							onClick={() => onPageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className="p-1.5 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
