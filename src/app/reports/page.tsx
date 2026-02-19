'use client';

import { BarChart2, FileText } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ChatButton } from '@/components/dashboard/chat-button';
import { Header } from '@/components/dashboard/header';
import { KpiCards } from '@/components/relatorios/kpi-cards';
import { ProductsChart } from '@/components/relatorios/products-chart';
import { RevenueChart } from '@/components/relatorios/revenue-chart';
import { StatusChart } from '@/components/relatorios/status-chart';
import { useSales } from '@/hooks/use-sales';
import { PERIODS, type Period } from '@/utils/constants/periods';
import { STATUS_LABELS } from '@/utils/constants/status-label';
import { getDateRange } from '@/utils/dateRange';
import { formatDate } from '@/utils/formatDate';
import { filterByDateRange } from '@/utils/sales-analytics';

export default function Relatorios() {
	const { sales, isLoading } = useSales();
	const [period, setPeriod] = useState<Period>('30d');
	const contentRef = useRef<HTMLDivElement>(null);

	const periodConfig = PERIODS.find((p) => p.value === period) ?? PERIODS[0];
	const { from, to } = useMemo(() => getDateRange(period), [period]);
	const filteredSales = useMemo(
		() => (sales ? filterByDateRange(sales, from, to) : []),
		[sales, from, to],
	);

	function handleExportCSV() {
		if (!filteredSales || filteredSales.length === 0) return;

		const headers = [
			'Data',
			'Cliente',
			'Email',
			'Produto',
			'Valor (centavos)',
			'Status',
		];
		const rows = filteredSales.map((s) => [
			formatDate(s.date),
			s.customer.name,
			s.customer.email,
			s.product,
			String(s.amount),
			STATUS_LABELS[s.status]?.label ?? s.status,
		]);

		const csv = [headers, ...rows]
			.map((row) =>
				row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
			)
			.join('\n');

		const blob = new Blob([`\uFEFF${csv}`], {
			type: 'text/csv;charset=utf-8;',
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `vendas-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
					<div>
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<BarChart2 className="w-6 h-6 text-violet-400" />
							Relatórios
						</h2>
						<p className="text-gray-400 mt-1">
							Análise de desempenho das suas vendas.
						</p>
					</div>

					<div className="flex items-center gap-3 flex-wrap">
						<div className="flex items-center gap-1 bg-[#1a1a1d] border border-white/10 rounded-xl p-1">
							{PERIODS.map((p) => (
								<button
									key={p.value}
									type="button"
									onClick={() => setPeriod(p.value)}
									className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
										period === p.value
											? 'bg-violet-600 text-white'
											: 'text-gray-400 hover:text-white'
									}`}
								>
									{p.label}
								</button>
							))}
						</div>

						<button
							type="button"
							onClick={handleExportCSV}
							disabled={isLoading || filteredSales.length === 0}
							className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1d] border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
						>
							<FileText className="w-4 h-4" />
							CSV
						</button>
					</div>
				</div>

				<div ref={contentRef} className="space-y-6">
					<KpiCards sales={filteredSales} isLoading={isLoading} />

					<RevenueChart
						sales={filteredSales}
						from={from}
						to={to}
						groupBy={periodConfig.groupBy}
						isLoading={isLoading}
					/>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<StatusChart sales={filteredSales} isLoading={isLoading} />
						<ProductsChart sales={filteredSales} isLoading={isLoading} />
					</div>
				</div>
			</main>

			<ChatButton />
		</div>
	);
}
