'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
	createPlanCheckout,
	getPublicPlans,
} from '../services/landing-plans.service';
import type { LandingPlan, PlanInterval } from '../types/landing-plans';

/** Plano destacado ("MAIS ESCOLHIDO"). */
const FEATURED_KEY = 'avan';

export const landingPlansQueryKey = ['landing-plans'] as const;

/**
 * Busca os planos publicados (público) e mapeia pro shape de exibição.
 * As features (bullets) e cores ficam na própria seção, por `key`.
 */
export function useLandingPlans() {
	return useQuery({
		queryKey: landingPlansQueryKey,
		queryFn: async (): Promise<LandingPlan[]> => {
			const plans = await getPublicPlans();
			return plans.map((p) => {
				const monthly =
					p.price_monthly_cents != null ? p.price_monthly_cents / 100 : null;
				const annual =
					p.price_yearly_cents != null ? p.price_yearly_cents / 100 : null;
				return {
					id: p.id,
					key: p.key,
					name: p.name,
					tagline: p.description ?? '',
					monthly,
					annual,
					installment: annual != null ? annual / 12 : null,
					featured: p.key === FEATURED_KEY,
					badge: p.key === FEATURED_KEY ? 'MAIS ESCOLHIDO' : undefined,
				};
			});
		},
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
}

/** Mutation de checkout: POST /v1/subscription → redireciona pro Stripe. */
export function usePlanCheckout() {
	return useMutation({
		mutationFn: (payload: { plan_key: string; interval: PlanInterval }) =>
			createPlanCheckout(payload),
		onSuccess: ({ checkout_url }) => {
			if (checkout_url) window.location.href = checkout_url;
		},
	});
}
