'use client';

import { useQuery } from '@tanstack/react-query';
import {
	getSalesAnalytics,
	getSalesSummary,
	getVoxesAnalytics,
	getVoxesSummary,
} from '../services/analytics.service';
import type {
	SalesAnalyticsParams,
	VoxesAnalyticsParams,
} from '../types/analytics';

export const analyticsQueryKeys = {
	sales: (params: SalesAnalyticsParams) =>
		['analytics', 'sales', params] as const,
	salesSummary: (params: SalesAnalyticsParams) =>
		['analytics', 'sales', 'summary', params] as const,
	voxes: (params: VoxesAnalyticsParams) =>
		['analytics', 'voxes', params] as const,
	voxesSummary: (params: VoxesAnalyticsParams) =>
		['analytics', 'voxes', 'summary', params] as const,
};

export function useSalesAnalytics(params: SalesAnalyticsParams = {}) {
	return useQuery({
		queryKey: analyticsQueryKeys.sales(params),
		queryFn: () => getSalesAnalytics(params),
	});
}

export function useSalesSummary(params: SalesAnalyticsParams = {}) {
	return useQuery({
		queryKey: analyticsQueryKeys.salesSummary(params),
		queryFn: () => getSalesSummary(params),
	});
}

export function useVoxesAnalytics(params: VoxesAnalyticsParams = {}) {
	return useQuery({
		queryKey: analyticsQueryKeys.voxes(params),
		queryFn: () => getVoxesAnalytics(params),
	});
}

export function useVoxesSummary(params: VoxesAnalyticsParams = {}) {
	return useQuery({
		queryKey: analyticsQueryKeys.voxesSummary(params),
		queryFn: () => getVoxesSummary(params),
	});
}
