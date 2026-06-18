/** Intervalo de cobrança de um plano. */
export type PlanInterval = 'monthly' | 'yearly';

/**
 * Shape de exibição usado pela seção de planos da landing (derivado de `Plan`).
 * Não é resposta de API — a validação Zod fica no service, sobre `planSchema`.
 */
export interface LandingPlan {
	id: string;
	key: string;
	name: string;
	tagline: string;
	/** Em reais (já dividido por 100). null = não configurado. */
	monthly: number | null;
	annual: number | null;
	/** Parcela = anual / 12 (sem juros). */
	installment: number | null;
	featured: boolean;
	badge?: string;
}
