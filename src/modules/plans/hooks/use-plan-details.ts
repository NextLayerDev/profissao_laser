'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlanDetails } from '../services/plan-details.service';

export const planDetailsQueryKey = (planId: string) =>
	['plans', planId, 'details'] as const;

export function usePlanDetails(planId: string) {
	return useQuery({
		queryKey: planDetailsQueryKey(planId),
		queryFn: () => getPlanDetails(planId),
		enabled: !!planId,
	});
}
