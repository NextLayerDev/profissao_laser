'use client';

import {
	CheckCircle,
	DollarSign,
	ShoppingCart,
	TrendingUp,
} from 'lucide-react';
import type { Sales } from '@/types/sales';
import { formatCurrency } from '@/utils/format-currency';
import { getSummaryKPIs } from '@/utils/sales-analytics';

interface Props {
	sales: Sales[];
	isLoading: boolean;
}

export function KpiCards({ sales, isLoading }: Props) {
	const kpis = getSummaryKPIs(sales);

	const cards = [
		{
			title: 'Receita Total',
			value: isLoading
				? '...'
				: formatCurrency(kpis.totalRevenue, kpis.currency),
			icon: DollarSign,
			iconBg: 'bg-violet-600',
			desc: 'Vendas pagas no período',
		},
		{
			title: 'Total de Vendas',
			value: isLoading ? '...' : String(kpis.totalSales),
			icon: ShoppingCart,
			iconBg: 'bg-blue-600',
			desc: 'Todas as transações',
		},
		{
			title: 'Ticket Médio',
			value: isLoading ? '...' : formatCurrency(kpis.avgTicket, kpis.currency),
			icon: TrendingUp,
			iconBg: 'bg-emerald-600',
			desc: 'Por venda aprovada',
		},
		{
			title: 'Taxa de Aprovação',
			value: isLoading ? '...' : `${kpis.paidRate.toFixed(1)}%`,
			icon: CheckCircle,
			iconBg: 'bg-amber-600',
			desc: 'Vendas aprovadas',
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => (
				<div
					key={card.title}
					className="bg-white dark:bg-[#1a1a1d] rounded-2xl p-6 border border-slate-200 dark:border-gray-800/50 shadow-sm dark:shadow-none"
				>
					<div className="flex items-start justify-between mb-4">
						<span className="text-slate-600 dark:text-gray-400 text-sm">
							{card.title}
						</span>
						<div className={`${card.iconBg} p-2.5 rounded-xl`}>
							<card.icon className="w-5 h-5 text-white" />
						</div>
					</div>
					<div className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">
						{card.value}
					</div>
					<span className="text-sm text-slate-500 dark:text-gray-500">
						{card.desc}
					</span>
				</div>
			))}
		</div>
	);
}
