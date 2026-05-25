'use client';

import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSales, getAnalyticsSummary } from '@/services/analytics';
import type {
	AnalyticsSalesParams,
	AnalyticsSummaryParams,
} from '@/types/analytics';

export function useAnalyticsSales(params: AnalyticsSalesParams = {}) {
	return useQuery({
		queryKey: ['analytics-sales', params],
		queryFn: () => getAnalyticsSales(params),
		placeholderData: (prev) => prev,
	});
}

export function useAnalyticsSummary(params: AnalyticsSummaryParams = {}) {
	return useQuery({
		queryKey: ['analytics-summary', params],
		queryFn: () => getAnalyticsSummary(params),
		placeholderData: (prev) => prev,
	});
}
