'use client';

import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import type { Sales } from '@/types/sales';
import { formatCurrency } from '@/utils/format-currency';
import { type GroupBy, getRevenueGrouped } from '@/utils/sales-analytics';

interface Props {
	sales: Sales[];
	from: Date;
	to: Date;
	groupBy: GroupBy;
	isLoading: boolean;
}

function abbrev(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
	return value.toFixed(0);
}

export function RevenueChart({ sales, from, to, groupBy, isLoading }: Props) {
	const data = getRevenueGrouped(sales, from, to, groupBy);
	const currency = sales[0]?.currency ?? 'BRL';

	return (
		<div className="bg-[#1a1a1d] rounded-2xl p-6 border border-gray-800/50">
			<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
				Receita ao Longo do Tempo
			</h3>

			{isLoading ? (
				<div className="h-64 flex items-center justify-center text-gray-500 animate-pulse">
					Carregando...
				</div>
			) : data.every((d) => d.revenue === 0) ? (
				<div className="h-64 flex items-center justify-center text-gray-500">
					Sem receita no período
				</div>
			) : (
				<ResponsiveContainer width="100%" height={260}>
					<LineChart
						data={data}
						margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
						<XAxis
							dataKey="label"
							stroke="#6b7280"
							tick={{ fill: '#6b7280', fontSize: 11 }}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							stroke="#6b7280"
							tick={{ fill: '#6b7280', fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							tickFormatter={abbrev}
						/>
						<Tooltip
							contentStyle={{
								background: '#1a1a1d',
								border: '1px solid #ffffff1a',
								borderRadius: '12px',
								color: '#fff',
							}}
							formatter={(value) => [
								formatCurrency((value as number) ?? 0, currency),
								'Receita',
							]}
							labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
						/>
						<Line
							type="monotone"
							dataKey="revenue"
							stroke="#7c3aed"
							strokeWidth={2.5}
							dot={false}
							activeDot={{
								r: 5,
								fill: '#7c3aed',
								stroke: '#fff',
								strokeWidth: 2,
							}}
						/>
					</LineChart>
				</ResponsiveContainer>
			)}
		</div>
	);
}
