/**
 * Mapas de status de assinatura (Stripe) compartilhados entre a lista de alunos
 * (`alunos-admin-view.tsx`) e o detalhe do aluno (`student-detail-view.tsx`).
 */

export const STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	trialing: 'Em teste',
	canceled: 'Cancelado',
	past_due: 'Vencido',
	incomplete: 'Incompleto',
	incomplete_expired: 'Expirado',
	paused: 'Pausado',
	unpaid: 'Não pago',
};

export const STATUS_COLORS: Record<string, string> = {
	active:
		'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
	trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
	canceled: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500',
	past_due: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
	incomplete:
		'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
	incomplete_expired:
		'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500',
	paused: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500',
	unpaid: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

const FALLBACK_COLOR =
	'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500';

/** Rótulo legível para um status (ou `'Sem assinatura'` quando nulo). */
export function statusLabel(status: string | null): string {
	if (!status) return 'Sem assinatura';
	return STATUS_LABELS[status] ?? status;
}

/** Classes de cor do badge para um status (com fallback neutro). */
export function statusColor(status: string | null): string {
	if (!status) return FALLBACK_COLOR;
	return STATUS_COLORS[status] ?? FALLBACK_COLOR;
}
