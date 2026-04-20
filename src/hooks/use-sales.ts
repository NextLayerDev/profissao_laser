'use client';

import { useQuery } from '@tanstack/react-query';
import {
	type GetRecurringParams,
	getRecurringSales,
	getSales,
	getSalesAttempts,
} from '@/services/sales';
import type { RecurringSubscription, Sales } from '@/types/sales';

export function useSales() {
	const { data, error, isLoading } = useQuery({
		queryKey: ['sales'],
		queryFn: getSales,
	});

	return {
		sales: (data as Sales[]) ?? [],
		error,
		isLoading,
	};
}

export function useSalesAttempts() {
	const { data, error, isLoading } = useQuery({
		queryKey: ['sales-attempts'],
		queryFn: getSalesAttempts,
	});

	return {
		attempts: (data as Sales[]) ?? [],
		error,
		isLoading,
	};
}

export function useRecurringSales(params: GetRecurringParams = {}) {
	const { data, error, isLoading } = useQuery({
		queryKey: ['sales-recurring', params],
		queryFn: () => getRecurringSales(params),
	});

	return {
		subscriptions: (data as RecurringSubscription[]) ?? [],
		error,
		isLoading,
	};
}
