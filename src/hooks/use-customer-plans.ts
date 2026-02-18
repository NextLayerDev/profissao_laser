'use client';

import { useQuery } from '@tanstack/react-query';
import { getCustomerPlans } from '@/services/plans';

export function useCustomerPlans(email: string | null) {
	return useQuery({
		queryKey: ['customer-plans', email],
		queryFn: () => getCustomerPlans(email as string),
		enabled: !!email,
	});
}
