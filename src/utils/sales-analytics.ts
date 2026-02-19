import type { Sales } from '@/types/sales';

export type GroupBy = 'day' | 'week' | 'month';

export function filterByDateRange(
	sales: Sales[],
	from: Date,
	to: Date,
): Sales[] {
	const fromStr = from.toISOString().split('T')[0];
	const toStr = to.toISOString().split('T')[0];
	return sales.filter((s) => {
		const dateStr = s.date.split('T')[0];
		return dateStr >= fromStr && dateStr <= toStr;
	});
}

function getGroupKey(date: Date, groupBy: GroupBy): string {
	if (groupBy === 'day') {
		return date.toISOString().split('T')[0];
	}
	if (groupBy === 'week') {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		d.setDate(diff);
		return d.toISOString().split('T')[0];
	}
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatGroupLabel(key: string, groupBy: GroupBy): string {
	if (groupBy === 'day' || groupBy === 'week') {
		const [_year, month, day] = key.split('-');
		return `${day}/${month}`;
	}
	const [year, month] = key.split('-');
	return new Intl.DateTimeFormat('pt-BR', {
		month: 'short',
		year: '2-digit',
	}).format(new Date(Number(year), Number(month) - 1, 1));
}

export function getRevenueGrouped(
	sales: Sales[],
	from: Date,
	to: Date,
	groupBy: GroupBy,
): { key: string; label: string; revenue: number }[] {
	const grouped: Record<string, number> = {};
	for (const sale of sales) {
		if (sale.status !== 'paid') continue;
		const key = getGroupKey(new Date(sale.date), groupBy);
		grouped[key] = (grouped[key] ?? 0) + sale.amount;
	}

	const result: { key: string; label: string; revenue: number }[] = [];
	const current = new Date(from);
	const seen = new Set<string>();

	while (current <= to) {
		const key = getGroupKey(current, groupBy);
		if (!seen.has(key)) {
			seen.add(key);
			result.push({
				key,
				label: formatGroupLabel(key, groupBy),
				revenue: grouped[key] ?? 0,
			});
		}
		current.setDate(current.getDate() + 1);
	}

	return result;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
	paid: { label: 'Pago', color: '#22c55e' },
	pending: { label: 'Pendente', color: '#eab308' },
	refunded: { label: 'Reembolsado', color: '#ef4444' },
	canceled: { label: 'Cancelado', color: '#6b7280' },
};

export function getSalesByStatus(sales: Sales[]): {
	status: string;
	label: string;
	count: number;
	revenue: number;
	color: string;
}[] {
	const grouped: Record<string, { count: number; revenue: number }> = {};
	for (const sale of sales) {
		if (!grouped[sale.status]) {
			grouped[sale.status] = { count: 0, revenue: 0 };
		}
		grouped[sale.status].count++;
		grouped[sale.status].revenue += sale.amount;
	}

	return Object.entries(grouped).map(([status, data]) => ({
		status,
		label: STATUS_CONFIG[status]?.label ?? status,
		color: STATUS_CONFIG[status]?.color ?? '#6b7280',
		...data,
	}));
}

export function getTopProducts(
	sales: Sales[],
	n = 6,
): { product: string; revenue: number; count: number }[] {
	const paidSales = sales.filter((s) => s.status === 'paid');
	const grouped: Record<string, { revenue: number; count: number }> = {};

	for (const sale of paidSales) {
		if (!grouped[sale.product]) {
			grouped[sale.product] = { revenue: 0, count: 0 };
		}
		grouped[sale.product].revenue += sale.amount;
		grouped[sale.product].count++;
	}

	return Object.entries(grouped)
		.map(([product, data]) => ({ product, ...data }))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, n);
}

export function getSummaryKPIs(sales: Sales[]): {
	totalRevenue: number;
	totalSales: number;
	avgTicket: number;
	paidRate: number;
	currency: string;
} {
	const paidSales = sales.filter((s) => s.status === 'paid');
	const totalRevenue = paidSales.reduce((acc, s) => acc + s.amount, 0);
	const totalSales = sales.length;
	const avgTicket = paidSales.length > 0 ? totalRevenue / paidSales.length : 0;
	const paidRate = totalSales > 0 ? (paidSales.length / totalSales) * 100 : 0;
	const currency = sales[0]?.currency ?? 'BRL';
	return { totalRevenue, totalSales, avgTicket, paidRate, currency };
}
