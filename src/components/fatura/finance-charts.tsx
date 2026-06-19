'use client';

import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

export type MonthRow = {
	label: string;
	bruta: number;
	repasse: number;
	liquido: number;
};
export type Slice = { name: string; value: number; color: string };

const brl = (n: number) =>
	n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const abbrev = (v: number) =>
	v >= 1_000_000
		? `${(v / 1_000_000).toFixed(1)}M`
		: v >= 1_000
			? `${(v / 1_000).toFixed(0)}k`
			: `${v}`;

const TOOLTIP = {
	background: '#1a1a1d',
	border: '1px solid #ffffff1a',
	borderRadius: '12px',
	color: '#fff',
	fontSize: 12,
};

function ChartCard({
	title,
	Icon,
	children,
}: {
	title: string;
	Icon: typeof BarChart3;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-white/8 shadow-sm dark:shadow-none">
			<h3 className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-6">
				<Icon className="w-4 h-4" />
				{title}
			</h3>
			{children}
		</div>
	);
}

const Empty = ({ text }: { text: string }) => (
	<div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-gray-500">
		{text}
	</div>
);

export function FinanceCharts({
	monthly,
	composition,
}: {
	monthly: MonthRow[];
	composition: Slice[];
}) {
	const hasMonthly = monthly.some((m) => m.bruta || m.repasse || m.liquido);
	const comp = composition.filter((s) => s.value > 0);

	if (!hasMonthly && comp.length === 0) return null;

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
				Gráficos
			</h3>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<ChartCard title="Evolução mensal" Icon={BarChart3}>
					{hasMonthly ? (
						<ResponsiveContainer width="100%" height={260}>
							<BarChart
								data={monthly}
								margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
								barGap={2}
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
									cursor={{ fill: '#7c3aed12' }}
									contentStyle={TOOLTIP}
									labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
									formatter={(value, name) => [
										brl(Number(value)),
										String(name),
									]}
								/>
								<Legend
									wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
									iconType="circle"
								/>
								<Bar
									dataKey="bruta"
									name="Bruta"
									fill="#0ea5e9"
									radius={[4, 4, 0, 0]}
								/>
								<Bar
									dataKey="repasse"
									name="Repasse"
									fill="#7c3aed"
									radius={[4, 4, 0, 0]}
								/>
								<Bar
									dataKey="liquido"
									name="Líquido"
									fill="#10b981"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<Empty text="Sem dados mensais no período" />
					)}
				</ChartCard>

				<ChartCard title="Para onde vai a receita" Icon={PieIcon}>
					{comp.length > 0 ? (
						<ResponsiveContainer width="100%" height={260}>
							<PieChart>
								<Pie
									data={comp}
									dataKey="value"
									nameKey="name"
									cx="50%"
									cy="50%"
									innerRadius={58}
									outerRadius={88}
									paddingAngle={2}
									stroke="none"
								>
									{comp.map((s) => (
										<Cell key={s.name} fill={s.color} />
									))}
								</Pie>
								<Tooltip
									contentStyle={TOOLTIP}
									formatter={(value, name) => [
										brl(Number(value)),
										String(name),
									]}
								/>
								<Legend
									wrapperStyle={{ fontSize: 12 }}
									iconType="circle"
									layout="vertical"
									align="right"
									verticalAlign="middle"
								/>
							</PieChart>
						</ResponsiveContainer>
					) : (
						<Empty text="Sem repasse no período" />
					)}
				</ChartCard>
			</div>
		</div>
	);
}
