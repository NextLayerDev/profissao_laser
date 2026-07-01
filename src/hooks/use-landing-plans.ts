'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { PlanFeatureItem } from '@/modules/plans/types/plans';
import {
	createPlanCheckout,
	getPublicPlans,
	type PlanInterval,
} from '@/services/landing-plans';

/** Plano destacado ("MAIS ESCOLHIDO"). */
const FEATURED_KEY = 'avan';

/** Shape de exibição usado pela seção de planos da landing. */
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
	/** Itens definidos pelo admin (tools/áreas/texto). Vazio → landing usa a lista padrão. */
	features: PlanFeatureItem[];
}

/**
 * Busca os planos publicados (público) e mapeia pro shape de exibição.
 * As features (bullets) e cores ficam na própria seção, por `key`.
 */
export function useLandingPlans() {
	return useQuery({
		queryKey: ['landing-plans'],
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
					features: p.features ?? [],
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
