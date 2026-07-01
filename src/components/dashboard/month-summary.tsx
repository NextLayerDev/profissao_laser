'use client';

import { useSales } from '@/hooks/use-sales';
import { usePermissions } from '@/modules/access';
import { formatCurrency } from '@/utils/format-currency';

const BAR_COLORS = [
	'bg-blue-600',
	'bg-yellow-400',
	'bg-green-400',
	'bg-orange-400',
	'bg-red-400',
];

export function MonthSummary() {
	const { sales, isLoading } = useSales();
	const { canPrice, can } = usePermissions();

	// Sem permissão de ver vendas, nada de resumo de vendas/receita na home.
	if (!can('vendas.view')) return null;

	const paid = (sales ?? []).filter((s) => s.status === 'succeeded');
	const currency = paid[0]?.currency ?? 'BRL';

	// Top products from all-time paid sales
	const productMap = new Map<string, number>();
	for (const s of paid) {
		productMap.set(s.product, (productMap.get(s.product) ?? 0) + s.amount);
	}
	const topProducts = [...productMap.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);
	const maxRevenue = topProducts[0]?.[1] ?? 1;

	return (
		<div className="space-y-4">
			{/* Produtos Mais Vendidos */}
			<div>
				<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
					Produtos Mais Vendidos
				</h3>
				<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800/50 p-5 shadow-sm dark:shadow-none space-y-4">
					{isLoading ? (
						<div className="animate-pulse space-y-4">
							{[80, 60, 45, 30, 20].map((w) => (
								<div key={w}>
									<div className="flex items-center justify-between mb-1.5">
										<div
											className="h-3.5 bg-slate-200 dark:bg-gray-700 rounded"
											style={{ width: `${w}%` }}
										/>
										<div className="h-3.5 w-12 bg-slate-200 dark:bg-gray-700 rounded ml-2" />
									</div>
									<div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
										<div
											className="h-full bg-slate-200 dark:bg-gray-700 rounded-full"
											style={{ width: `${w}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					) : (
						<>
							{topProducts.length === 0 && (
								<p className="text-sm text-slate-500 dark:text-gray-500">
									Sem dados disponíveis.
								</p>
							)}
							{topProducts.map(([product, revenue], idx) => {
								const pct = (revenue / maxRevenue) * 100;
								return (
									<div key={product}>
										<div className="flex items-center justify-between mb-1.5">
											<span
												className="text-sm text-slate-700 dark:text-gray-300 truncate max-w-[160px]"
												title={product}
											>
												{product}
											</span>
											<div className="text-right shrink-0 ml-2 flex items-center gap-1.5">
												{canPrice && (
													<span className="text-sm font-semibold text-slate-900 dark:text-white">
														{formatCurrency(revenue, currency)}
													</span>
												)}
												<span className="text-xs text-slate-400 dark:text-gray-600">
													{pct.toFixed(0)}%
												</span>
											</div>
										</div>
										<div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
											<div
												className={`h-full ${BAR_COLORS[idx]} rounded-full transition-all duration-500`}
												style={{ width: `${pct}%` }}
											/>
										</div>
									</div>
								);
							})}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
