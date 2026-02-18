'use client';

import { Layers, ShoppingCart, TrendingUp, Users2 } from 'lucide-react';
import { useSales } from '@/hooks/use-sales';
import { formatCurrency } from '@/utils/format-currency';

export function StatsOverview() {
	const { sales, isLoading } = useSales();

	const today = new Date().toISOString().split('T')[0];
	const yesterday = new Date(Date.now() - 86_400_000)
		.toISOString()
		.split('T')[0];

	const todaySales = sales?.filter((s) => s.date.startsWith(today)) ?? [];
	const yesterdaySales =
		sales?.filter((s) => s.date.startsWith(yesterday)) ?? [];

	const todayRevenue = todaySales.reduce((acc, s) => acc + s.amount, 0);
	const yesterdayRevenue = yesterdaySales.reduce((acc, s) => acc + s.amount, 0);

	const revenueChange =
		yesterdayRevenue === 0
			? 0
			: ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

	const todayStudents = new Set(todaySales.map((s) => s.customer.email)).size;
	const currency = todaySales[0]?.currency ?? 'BRL';

	const cards = [
		{
			title: 'Vendas Hoje',
			value: isLoading ? '...' : formatCurrency(todayRevenue, currency),
			subtitle: isLoading
				? ''
				: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(0)}% vs ontem`,
			subtitleColor: revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500',
			icon: ShoppingCart,
			iconBg: 'bg-blue-600',
		},
		{
			title: 'Novos Alunos',
			value: isLoading ? '...' : String(todayStudents),
			subtitle: 'Hoje',
			subtitleColor: 'text-blue-400',
			icon: Users2,
			iconBg: 'bg-amber-600',
		},
		{
			title: 'Taxa de Conversão',
			value: '2.5%',
			subtitle: '+0.5% vs semana passada',
			subtitleColor: 'text-gray-400',
			icon: TrendingUp,
			iconBg: 'bg-emerald-600',
		},
		{
			title: 'Produtos Ativos',
			value: '10',
			subtitle: '10 Serviços',
			subtitleColor: 'text-gray-400',
			icon: Layers,
			iconBg: 'bg-rose-600',
		},
	];

	return (
		<section className="mb-8">
			<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
				Visão Geral
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{cards.map((card) => (
					<div
						key={card.title}
						className="bg-[#1a1a1d] rounded-2xl p-6 border border-gray-800/50 hover:border-gray-700 transition-all duration-300 group"
					>
						<div className="flex items-start justify-between mb-4">
							<span className="text-gray-400 text-sm">{card.title}</span>
							<div className={`${card.iconBg} p-2.5 rounded-xl`}>
								<card.icon className="w-5 h-5 text-white" />
							</div>
						</div>
						<div className="text-3xl font-bold mb-1">{card.value}</div>
						<span className={`text-sm ${card.subtitleColor}`}>
							{card.subtitle}
						</span>
					</div>
				))}
			</div>
		</section>
	);
}
