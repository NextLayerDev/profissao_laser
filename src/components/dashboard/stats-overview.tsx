'use client';

import { Layers, ShoppingCart, TrendingUp, Users2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useProducts } from '@/hooks/use-products';
import { useSales } from '@/hooks/use-sales';
import { formatCurrency } from '@/utils/format-currency';

function Sparkline() {
	const points = [8, 20, 14, 28, 18, 35, 25, 40, 30, 48];
	const max = Math.max(...points);
	const min = Math.min(...points);
	const norm = (v: number) => 44 - ((v - min) / (max - min)) * 40;
	const pathD = points
		.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${norm(v)}`)
		.join(' ');
	return (
		<svg
			width="100"
			height="48"
			viewBox="0 0 90 48"
			fill="none"
			className="absolute bottom-3 right-3 opacity-30"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
					<stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
				</linearGradient>
			</defs>
			<path d={`${pathD} L 90 48 L 0 48 Z`} fill="url(#sparkGrad)" />
			<path
				d={pathD}
				stroke="#3b82f6"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function BarChart() {
	const bars = [
		{ id: 'a', h: 40 },
		{ id: 'b', h: 65 },
		{ id: 'c', h: 45 },
		{ id: 'd', h: 80 },
		{ id: 'e', h: 55 },
		{ id: 'f', h: 90 },
		{ id: 'g', h: 70 },
	];
	return (
		<div className="absolute bottom-3 right-3 flex items-end gap-1 opacity-25">
			{bars.map((bar) => (
				<div
					key={bar.id}
					className="w-2 bg-emerald-500 rounded-sm"
					style={{ height: `${bar.h * 0.4}px` }}
				/>
			))}
		</div>
	);
}

export function StatsOverview() {
	const { sales, isLoading } = useSales();
	const { products } = useProducts();
	const { canPrice } = usePermissions();

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

	const allCards = [
		{
			title: 'Vendas Hoje',
			value: isLoading ? '...' : formatCurrency(todayRevenue, currency),
			subtitle: isLoading
				? ''
				: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(0)}% vs ontem`,
			subtitleColor: revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500',
			icon: ShoppingCart,
			iconBg: 'bg-blue-700',
			gradient:
				'from-blue-100 to-white dark:from-blue-700/30 dark:to-[#1a1a1d]',
			financial: true,
			decoration: <Sparkline />,
		},
		{
			title: 'Novos Alunos',
			value: isLoading ? '...' : String(todayStudents),
			subtitle: 'Hoje',
			subtitleColor: 'text-blue-400',
			icon: Users2,
			iconBg: 'bg-amber-600',
			gradient:
				'from-amber-100 to-white dark:from-amber-600/30 dark:to-[#1a1a1d]',
			financial: false,
			decoration: (
				<Users2
					className="absolute bottom-2 right-3 w-16 h-16 text-amber-400 opacity-10"
					aria-hidden="true"
				/>
			),
		},
		{
			title: 'Taxa de Conversão',
			value: '2.5%',
			subtitle: '+0.5% vs semana passada',
			subtitleColor: 'text-gray-400',
			icon: TrendingUp,
			iconBg: 'bg-emerald-600',
			gradient:
				'from-emerald-100 to-white dark:from-emerald-600/30 dark:to-[#1a1a1d]',
			financial: false,
			decoration: <BarChart />,
		},
		{
			title: 'Produtos Ativos',
			value: products
				? String(products.filter((p) => p.status === 'ativo').length)
				: '...',
			subtitle: products ? `${products.length} no total` : '',
			subtitleColor: 'text-gray-400',
			icon: Layers,
			iconBg: 'bg-rose-600',
			gradient:
				'from-rose-100 to-white dark:from-rose-600/30 dark:to-[#1a1a1d]',
			financial: false,
			decoration: (
				<Layers
					className="absolute bottom-2 right-3 w-16 h-16 text-rose-400 opacity-10"
					aria-hidden="true"
				/>
			),
		},
	];

	const cards = canPrice ? allCards : allCards.filter((c) => !c.financial);

	return (
		<section className="mb-8">
			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
				Visão Geral
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{cards.map((card) => (
					<div
						key={card.title}
						className={`relative overflow-hidden bg-linear-to-br ${card.gradient} rounded-2xl p-6 border border-slate-200 dark:border-gray-800/50 hover:border-slate-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm dark:shadow-none`}
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
						<span className={`text-sm ${card.subtitleColor}`}>
							{card.subtitle}
						</span>
						{card.decoration}
					</div>
				))}
			</div>
		</section>
	);
}
