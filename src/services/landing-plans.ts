import { type Plan, planSchema } from '@/modules/plans/types/plans';
import { apiCourses } from '@/shared/lib/api-courses';

export type PlanInterval = 'monthly' | 'yearly';

/**
 * Lista pública dos planos publicados (para a landing).
 * Ordena do mais barato pro mais caro (Starter → Elite).
 * Obs.: depende da rota /v1/plans estar pública na API de cursos (upvox).
 */
export async function getPublicPlans(): Promise<Plan[]> {
	const { data } = await apiCourses.get('/v1/plans');
	return planSchema
		.array()
		.parse(data)
		.filter((p) => p.published)
		.sort(
			(a, b) => (a.price_monthly_cents ?? 0) - (b.price_monthly_cents ?? 0),
		);
}

/**
 * Cria a sessão de checkout (Stripe) para assinar um plano.
 * Retorna a URL pra redirecionar.
 */
export async function createPlanCheckout(payload: {
	plan_key: string;
	interval: PlanInterval;
}): Promise<{ checkout_url: string }> {
	const { data } = await apiCourses.post('/v1/subscription', payload);
	return data as { checkout_url: string };
}
