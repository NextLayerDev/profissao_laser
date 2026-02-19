'use client';

import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from 'recharts';
import type { Sales } from '@/types/sales';
import { formatCurrency } from '@/utils/format-currency';
import { getSalesByStatus } from '@/utils/sales-analytics';

interface Props {
	sales: Sales[];
	isLoading: boolean;
}

export function StatusChart({ sales, isLoading }: Props) {
	const data = getSalesByStatus(sales);
	const currency = sales[0]?.currency ?? 'BRL';

	return (
		<div className="bg-[#1a1a1d] rounded-2xl p-6 border border-gray-800/50">
			<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
				Vendas por Status
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
					<PieChart>
						<Pie
							data={data}
							dataKey="count"
							nameKey="label"
							cx="50%"
							cy="50%"
							innerRadius={65}
							outerRadius={100}
							paddingAngle={3}
						>
							{data.map((entry) => (
								<Cell key={entry.status} fill={entry.color} />
							))}
						</Pie>
						<Tooltip
							contentStyle={{
								background: '#1a1a1d',
								border: '1px solid #ffffff1a',
								borderRadius: '12px',
								color: '#fff',
							}}
							formatter={(value, _name, props) => {
								const v = (value as number) ?? 0;
								const revenue = (props.payload as { revenue: number }).revenue;
								return [
									`${v} venda${v !== 1 ? 's' : ''} · ${formatCurrency(revenue, currency)}`,
									_name,
								];
							}}
						/>
						<Legend
							iconType="circle"
							iconSize={8}
							formatter={(value) => (
								<span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>
							)}
						/>
					</PieChart>
				</ResponsiveContainer>
			)}
		</div>
	);
}
