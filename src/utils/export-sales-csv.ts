import type { Sales } from '@/types/sales';
import { STATUS_LABELS } from '@/utils/constants/status-label';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';

export function exportSalesCSV(sales: Sales[]): void {
	if (!sales || sales.length === 0) return;

	const headers = ['Usuário', 'E-mail', 'Produto', 'Valor', 'Status', 'Data'];
	const rows = sales.map((s) => [
		s.customer.name,
		s.customer.email,
		s.product,
		formatCurrency(s.amount, s.currency ?? 'BRL'),
		STATUS_LABELS[s.status]?.label ?? s.status,
		formatDate(s.date),
	]);

	const csv = [headers, ...rows]
		.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
		.join('\n');

	const blob = new Blob([`\uFEFF${csv}`], {
		type: 'text/csv;charset=utf-8;',
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}
