'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useSales } from '@/hooks/use-sales';
import { formatCurrency } from '@/utils/format-currency';

const BAR_COLORS = [
	'bg-blue-600',
	'bg-yellow-400',
	'bg-green-400',
	'bg-orange-400',
	'bg-red-400',
];

function getMonthRange(year: number, month: number) {
	const start = `${year}-${String(month).padStart(2, '0')}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
	return { start, end };
}

export function MonthSummary() {
	const { sales, isLoading } = useSales();
	const { canPrice } = usePermissions();

	const now = new Date();
	const curYear = now.getFullYear();
	const curMonth = now.getMonth() + 1;
	const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
	const prevYear = curMonth === 1 ? curYear - 1 : curYear;

	const { start: curStart, end: curEnd } = getMonthRange(curYear, curMonth);
	const { start: prevStart, end: prevEnd } = getMonthRange(prevYear, prevMonth);

	const paid = (sales ?? []).filter((s) => s.status === 'succeeded');

	const curSales = paid.filter((s) => {
		const d = s.date.split('T')[0];
		return d >= curStart && d <= curEnd;
	});
	const prevSales = paid.filter((s) => {
		const d = s.date.split('T')[0];
		return d >= prevStart && d <= prevEnd;
	});

	const curRevenue = curSales.reduce((a, s) => a + s.amount, 0);
	const prevRevenue = prevSales.reduce((a, s) => a + s.amount, 0);
	const change =
		prevRevenue === 0 ? 0 : ((curRevenue - prevRevenue) / prevRevenue) * 100;
	const avgTicket = curSales.length > 0 ? curRevenue / curSales.length : 0;
	const currency = curSales[0]?.currency ?? paid[0]?.currency ?? 'BRL';
	const isPositive = change >= 0;

	const monthLabel = new Intl.DateTimeFormat('pt-BR', {
		month: 'long',
	}).format(new Date(curYear, curMonth - 1, 1));
	const monthCapitalized =
		monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

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
			{/* Total do Mês */}
			<div>
				<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
					Total do Mês
				</h3>
				<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800/50 p-5 shadow-sm dark:shadow-none">
					{isLoading ? (
						<div className="animate-pulse">
							<div className="flex items-center justify-between mb-3">
								<div className="h-4 w-20 bg-slate-200 dark:bg-gray-700 rounded" />
								<div className="w-8 h-8 bg-slate-200 dark:bg-gray-700 rounded-xl" />
							</div>
							<div className="h-8 w-32 bg-slate-200 dark:bg-gray-700 rounded mb-1" />
							<div className="h-3 w-28 bg-slate-200 dark:bg-gray-700 rounded mb-4" />
							<div className="flex items-center justify-between">
								<div className="h-3 w-16 bg-slate-200 dark:bg-gray-700 rounded" />
								<div className="h-3 w-24 bg-slate-200 dark:bg-gray-700 rounded" />
							</div>
						</div>
					) : (
						<>
							<div className="flex items-center justify-between mb-3">
								<span className="text-sm font-semibold text-slate-900 dark:text-white">
									{monthCapitalized}
								</span>
								<div className="p-2 bg-blue-700 rounded-xl">
									{isPositive ? (
										<TrendingUp className="w-4 h-4 text-white" />
									) : (
										<TrendingDown className="w-4 h-4 text-white" />
									)}
								</div>
							</div>
							{canPrice && (
								<>
									<div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
										{formatCurrency(curRevenue, currency)}
									</div>
									<p
										className={`text-xs mb-4 ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}
									>
										{isPositive ? '+' : ''}
										{change.toFixed(1)}% vs mês anterior
									</p>
									<div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-500">
										<span>{curSales.length} vendas</span>
										<span>
											{formatCurrency(avgTicket, currency)} / ticket médio
										</span>
									</div>
								</>
							)}
							{!canPrice && (
								<div className="text-2xl font-bold text-slate-900 dark:text-white">
									{curSales.length} vendas
								</div>
							)}
						</>
					)}
				</div>
			</div>

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
