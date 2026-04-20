'use client';

import { useQuery } from '@tanstack/react-query';
import {
	type GetRecurringParams,
	type GetRefundsParams,
	getRecurringSales,
	getRefunds,
	getSales,
	getSalesAttempts,
} from '@/services/sales';
import type { RecurringSubscription, Refund, Sales } from '@/types/sales';

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

export function useRefunds(params: GetRefundsParams = {}) {
	const { data, error, isLoading, isFetching } = useQuery({
		queryKey: ['sales-refunds', params],
		queryFn: () => getRefunds(params),
	});

	return {
		refunds: (data as Refund[]) ?? [],
		error,
		isLoading,
		isFetching,
	};
}
