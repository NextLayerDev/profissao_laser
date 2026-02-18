export function formatCurrency(value: number | null, currency: string): string {
	if (value == null) return 'Grátis';
	return value.toLocaleString('pt-BR', { style: 'currency', currency });
}
