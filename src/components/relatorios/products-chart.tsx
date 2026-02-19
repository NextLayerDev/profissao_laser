'use client';

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import type { Sales } from '@/types/sales';
import { formatCurrency } from '@/utils/format-currency';
import { getTopProducts } from '@/utils/sales-analytics';

interface Props {
	sales: Sales[];
	isLoading: boolean;
}

const COLORS = [
	'#7c3aed',
	'#6d28d9',
	'#5b21b6',
	'#4c1d95',
	'#3b0764',
	'#2e1065',
];

function abbrev(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
	return value.toFixed(0);
}

export function ProductsChart({ sales, isLoading }: Props) {
	const data = getTopProducts(sales, 6);
	const currency = sales[0]?.currency ?? 'BRL';

	return (
		<div className="bg-[#1a1a1d] rounded-2xl p-6 border border-gray-800/50">
			<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
				Top Produtos por Receita
			</h3>

			{isLoading ? (
				<div className="h-64 flex items-center justify-center text-gray-500 animate-pulse">
					Carregando...
				</div>
			) : data.length === 0 ? (
				<div className="h-64 flex items-center justify-center text-gray-500">
					Sem dados no período
				</div>
			) : (
				<ResponsiveContainer width="100%" height={260}>
					<BarChart
						data={data}
						layout="vertical"
						margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#ffffff0d"
							horizontal={false}
						/>
						<XAxis
							type="number"
							stroke="#6b7280"
							tick={{ fill: '#6b7280', fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							tickFormatter={abbrev}
						/>
						<YAxis
							type="category"
							dataKey="product"
							stroke="#6b7280"
							tick={{ fill: '#9ca3af', fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							width={120}
							tickFormatter={(v: string) =>
								v.length > 18 ? `${v.slice(0, 18)}…` : v
							}
						/>
						<Tooltip
							contentStyle={{
								background: '#1a1a1d',
								border: '1px solid #ffffff1a',
								borderRadius: '12px',
								color: '#fff',
							}}
							formatter={(value, _name, props) => {
								const v = (value as number) ?? 0;
								const count = (props.payload as { count: number }).count;
								return [
									`${formatCurrency(v, currency)} · ${count} venda${count !== 1 ? 's' : ''}`,
									'Receita',
								];
							}}
							cursor={{ fill: '#ffffff08' }}
						/>
						<Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
							{data.map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: stable order
								<Cell key={i} fill={COLORS[i % COLORS.length]} />
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			)}
		</div>
	);
}
