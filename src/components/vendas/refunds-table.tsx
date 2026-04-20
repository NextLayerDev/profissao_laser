'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Refund } from '@/types/sales';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { toTitleCase } from '@/utils/title-case';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
	succeeded: {
		label: 'Aprovado',
		color: 'bg-green-500/10 text-green-400 border-green-500/20',
	},
	pending: {
		label: 'Pendente',
		color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
	},
	failed: {
		label: 'Falhou',
		color: 'bg-red-500/10 text-red-400 border-red-500/20',
	},
};

const REASON_LABELS: Record<string, string> = {
	duplicate: 'Duplicado',
	fraudulent: 'Fraude',
	requested_by_customer: 'Solicitado pelo cliente',
};

interface Props {
	refunds: Refund[];
	hasMore: boolean;
	onLoadMore: () => void;
	onLoadPrev: () => void;
	hasPrev: boolean;
	isLoading: boolean;
}

export function RefundsTable({
	refunds,
	hasMore,
	onLoadMore,
	onLoadPrev,
	hasPrev,
	isLoading,
}: Props) {
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
								<th className="px-4 py-3 font-medium">Valor</th>
								<th className="px-4 py-3 font-medium hidden sm:table-cell">
									Status
								</th>
								<th className="px-4 py-3 font-medium hidden lg:table-cell">
									Motivo
								</th>
								<th className="px-4 py-3 font-medium">Data</th>
							</tr>
						</thead>
						<tbody>
							{refunds.length === 0 && !isLoading && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
									>
										Nenhum reembolso encontrado.
									</td>
								</tr>
							)}
							{refunds.map((refund) => {
								const statusInfo = STATUS_CONFIG[refund.status] ?? {
									label: refund.status,
									color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
								};

								return (
									<tr
										key={refund.id}
										className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
									>
										{/* Cliente */}
										<td className="px-4 py-3">
											<span className="font-medium text-slate-900 dark:text-white">
												{toTitleCase(refund.customer.name)}
											</span>
											{refund.customer.phone && (
												<span className="block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
													{refund.customer.phone}
												</span>
											)}
											<span className="md:hidden block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
												{refund.customer.email}
											</span>
										</td>

										{/* E-mail */}
										<td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-gray-400">
											{refund.customer.email}
										</td>

										{/* Valor */}
										<td className="px-4 py-3 tabular-nums font-medium text-slate-900 dark:text-white">
											{formatCurrency(
												refund.amount,
												refund.currency.toUpperCase(),
											)}
										</td>

										{/* Status */}
										<td className="px-4 py-3 hidden sm:table-cell">
											<span
												className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
											>
												{statusInfo.label}
											</span>
										</td>

										{/* Motivo */}
										<td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-gray-400">
											{refund.reason
												? (REASON_LABELS[refund.reason] ?? refund.reason)
												: '—'}
										</td>

										{/* Data */}
										<td className="px-4 py-3 tabular-nums text-slate-700 dark:text-gray-300">
											{formatDate(refund.date)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Cursor pagination */}
			<div className="flex items-center justify-between gap-4 mt-4 px-1">
				<span className="text-sm text-slate-500 dark:text-gray-500">
					{refunds.length} reembolso{refunds.length !== 1 ? 's' : ''} nesta
					página
				</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={onLoadPrev}
						disabled={!hasPrev || isLoading}
						className="p-1.5 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={onLoadMore}
						disabled={!hasMore || isLoading}
						className="p-1.5 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
