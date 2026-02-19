export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
	paid: { label: 'Pago', color: 'bg-green-500/10 text-green-400' },
	pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-400' },
	refunded: { label: 'Reembolsado', color: 'bg-red-500/10 text-red-400' },
	canceled: { label: 'Cancelado', color: 'bg-gray-500/10 text-gray-400' },
};
