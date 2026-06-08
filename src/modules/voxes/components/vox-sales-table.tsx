'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { toTitleCase } from '@/utils/title-case';
import type { VoxSale } from '../types/voxes';

interface Props {
	sales: VoxSale[];
	hasMore: boolean;
	hasPrev: boolean;
	onLoadMore: () => void;
	onLoadPrev: () => void;
	isLoading: boolean;
}

export function VoxSalesTable({
	sales,
	hasMore,
	hasPrev,
	onLoadMore,
	onLoadPrev,
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
								<th className="px-4 py-3 font-medium hidden lg:table-cell">
									Pacote
								</th>
								<th className="px-4 py-3 font-medium">Voxxys</th>
								<th className="px-4 py-3 font-medium">Valor</th>
								<th className="px-4 py-3 font-medium">Data</th>
							</tr>
						</thead>
						<tbody>
							{sales.length === 0 && !isLoading && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
									>
										Nenhuma venda de voxxys encontrada.
									</td>
								</tr>
							)}
							{sales.map((sale) => (
								<tr
									key={sale.id}
									className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
								>
									{/* Cliente */}
									<td className="px-4 py-3">
										<span className="font-medium text-slate-900 dark:text-white">
											{sale.customer_name
												? toTitleCase(sale.customer_name)
												: '—'}
										</span>
										<span className="md:hidden block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
											{sale.customer_email ?? '—'}
										</span>
									</td>

									{/* E-mail */}
									<td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-gray-400">
										{sale.customer_email ?? '—'}
									</td>

									{/* Pacote */}
									<td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-gray-400">
										{sale.package_name ?? '—'}
									</td>

									{/* Voxxys */}
									<td className="px-4 py-3">
										<span className="inline-flex items-center gap-1.5 tabular-nums font-medium text-slate-900 dark:text-white">
											<VoxxysIcon className="w-3.5 h-3.5" />
											{sale.vox_amount.toLocaleString('pt-BR')}
										</span>
									</td>

									{/* Valor */}
									<td className="px-4 py-3 tabular-nums font-medium text-slate-900 dark:text-white">
										{formatCurrency(sale.price_cents / 100, 'BRL')}
									</td>

									{/* Data */}
									<td className="px-4 py-3 tabular-nums text-slate-700 dark:text-gray-300">
										{formatDate(sale.created_at)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Paginação por offset */}
			<div className="flex items-center justify-between gap-4 mt-4 px-1">
				<span className="text-sm text-slate-500 dark:text-gray-500">
					{sales.length} venda{sales.length !== 1 ? 's' : ''} nesta página
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
