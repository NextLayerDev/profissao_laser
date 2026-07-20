'use client';

import { useQuery } from '@tanstack/react-query';
import { type FreeSummary, getFreeSummary } from '@/services/landing-free';

/**
 * Resumo público do que é grátis, para a landing. Espelha `useLandingPlans`:
 * React Query com `staleTime` de 5min e 1 retry. O serviço já resolve com
 * fallback estático, então `data` fica indefinido só no primeiro carregamento.
 */
export function useLandingFreeSummary() {
	return useQuery<FreeSummary>({
		queryKey: ['landing-free-summary'],
		queryFn: getFreeSummary,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
}
