export const COURSE_STATUS_STYLES: Record<string, string> = {
	active: 'bg-emerald-500/10 text-emerald-400',
	ativo: 'bg-emerald-500/10 text-emerald-400',
	inactive: 'bg-gray-700 text-gray-400',
	canceled: 'bg-red-500/10 text-red-400',
	cancelado: 'bg-red-500/10 text-red-400',
	past_due: 'bg-yellow-500/10 text-yellow-400',
	trialing: 'bg-blue-500/10 text-blue-400',
};

export const COURSE_STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	ativo: 'Ativo',
	inactive: 'Inativo',
	canceled: 'Cancelado',
	cancelado: 'Cancelado',
	past_due: 'Pagamento pendente',
	trialing: 'Em teste',
};
