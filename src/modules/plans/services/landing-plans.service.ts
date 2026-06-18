import { apiCourses } from '@/shared/lib/api-courses';
import type { PlanInterval } from '../types/landing-plans';
import { type Plan, planSchema } from '../types/plans';

function sortPublished(plans: Plan[]): Plan[] {
	return plans
		.filter((p) => p.published)
		.sort(
			(a, b) => (a.price_monthly_cents ?? 0) - (b.price_monthly_cents ?? 0),
		);
}

/**
 * Lista pública dos planos publicados (para a landing), ordenada do mais barato
 * pro mais caro (Starter → Elite).
 *
 * 1) Tenta a listagem global GET /v1/plans (quando estiver pública na upvox).
 * 2) Fallback PÚBLICO: descobre os planos pelo catálogo de cursos
 *    (GET /v1/courses → GET /v1/course/:slug/plans), deduplicando por `key`.
 *    Funciona hoje mesmo sem a rota global pública.
 */
export async function getPublicPlans(): Promise<Plan[]> {
	try {
		const { data } = await apiCourses.get('/v1/plans');
		const plans = planSchema.array().parse(data);
		if (plans.length > 0) return sortPublished(plans);
	} catch {
		// /v1/plans ainda não está público — cai pro catálogo por curso
	}

	const { data: courses } = await apiCourses.get('/v1/courses');
	const slugs = (Array.isArray(courses) ? courses : [])
		.map((c: { slug?: string }) => c?.slug)
		.filter((s): s is string => typeof s === 'string');

	const lists = await Promise.all(
		slugs.map((slug) =>
			apiCourses
				.get(`/v1/course/${slug}/plans`)
				.then((r) => (Array.isArray(r.data) ? r.data : []))
				.catch(() => [] as unknown[]),
		),
	);

	const byKey = new Map<string, Plan>();
	for (const list of lists) {
		for (const row of list as Array<{ plan?: unknown }>) {
			const parsed = planSchema.safeParse(row?.plan);
			if (parsed.success && !byKey.has(parsed.data.key)) {
				byKey.set(parsed.data.key, parsed.data);
			}
		}
	}
	return sortPublished([...byKey.values()]);
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
