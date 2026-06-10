'use client';

import { useQuery } from '@tanstack/react-query';
import {
	getFailedPaymentsAnalytics,
	getInvoicesAnalytics,
	getInvoicesSummary,
	getPlanRefunds,
	getSalesAnalytics,
	getSalesSummary,
	getVoxesAnalytics,
	getVoxesSummary,
	getVoxRefunds,
} from '../services/analytics.service';
import type {
	FailedPaymentsAnalyticsParams,
	InvoicesAnalyticsParams,
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
	invoices: (params: InvoicesAnalyticsParams) =>
		['analytics', 'invoices', params] as const,
	invoicesSummary: (params: InvoicesAnalyticsParams) =>
		['analytics', 'invoices', 'summary', params] as const,
	failedPayments: (params: FailedPaymentsAnalyticsParams) =>
		['analytics', 'invoices', 'failed', params] as const,
	planRefunds: ['analytics', 'refunds', 'plans'] as const,
	voxRefunds: ['analytics', 'refunds', 'vox'] as const,
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

export function useInvoicesAnalytics(params: InvoicesAnalyticsParams = {}) {
	return useQuery({
		queryKey: analyticsQueryKeys.invoices(params),
		queryFn: () => getInvoicesAnalytics(params),
	});
}

export function useInvoicesSummary(
	params: Omit<InvoicesAnalyticsParams, 'page' | 'per_page'> = {},
) {
	return useQuery({
		queryKey: analyticsQueryKeys.invoicesSummary(params),
		queryFn: () => getInvoicesSummary(params),
	});
}

export function useFailedPaymentsAnalytics(
	params: FailedPaymentsAnalyticsParams = {},
) {
	return useQuery({
		queryKey: analyticsQueryKeys.failedPayments(params),
		queryFn: () => getFailedPaymentsAnalytics(params),
	});
}

export function usePlanRefunds() {
	return useQuery({
		queryKey: analyticsQueryKeys.planRefunds,
		queryFn: getPlanRefunds,
	});
}

export function useVoxRefunds() {
	return useQuery({
		queryKey: analyticsQueryKeys.voxRefunds,
		queryFn: getVoxRefunds,
	});
}
