import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type InvoicesAnalytics,
	type InvoicesAnalyticsParams,
	type InvoicesSummary,
	invoicesAnalyticsSchema,
	invoicesSummarySchema,
	type RefundRow,
	refundRowSchema,
	type SalesAnalytics,
	type SalesAnalyticsParams,
	type SalesSummary,
	salesAnalyticsSchema,
	salesSummarySchema,
	type VoxesAnalytics,
	type VoxesAnalyticsParams,
	type VoxesSummary,
	voxesAnalyticsSchema,
	voxesSummarySchema,
} from '../types/analytics';

export async function getSalesAnalytics(
	params: SalesAnalyticsParams = {},
): Promise<SalesAnalytics> {
	const { data } = await api.get('/v1/admin/analytics/sales', { params });
	return salesAnalyticsSchema.parse(data);
}

export async function getSalesSummary(
	params: Omit<SalesAnalyticsParams, 'page' | 'per_page' | 'sort'> = {},
): Promise<SalesSummary> {
	const { data } = await api.get('/v1/admin/analytics/sales/summary', {
		params,
	});
	return salesSummarySchema.parse(data);
}

export async function getVoxesAnalytics(
	params: VoxesAnalyticsParams = {},
): Promise<VoxesAnalytics> {
	const { data } = await api.get('/v1/admin/analytics/voxes', { params });
	return voxesAnalyticsSchema.parse(data);
}

export async function getVoxesSummary(
	params: Omit<VoxesAnalyticsParams, 'page' | 'per_page' | 'sort'> = {},
): Promise<VoxesSummary> {
	const { data } = await api.get('/v1/admin/analytics/voxes/summary', {
		params,
	});
	return voxesSummarySchema.parse(data);
}

export async function getInvoicesAnalytics(
	params: InvoicesAnalyticsParams = {},
): Promise<InvoicesAnalytics> {
	const { data } = await api.get('/v1/admin/analytics/invoices', { params });
	return invoicesAnalyticsSchema.parse(data);
}

export async function getInvoicesSummary(
	params: Omit<InvoicesAnalyticsParams, 'page' | 'per_page'> = {},
): Promise<InvoicesSummary> {
	const { data } = await api.get('/v1/admin/analytics/invoices/summary', {
		params,
	});
	return invoicesSummarySchema.parse(data);
}

export async function getPlanRefunds(): Promise<RefundRow[]> {
	const { data } = await api.get('/v1/refunds/plans');
	return refundRowSchema.array().parse(data);
}

export async function getVoxRefunds(): Promise<RefundRow[]> {
	const { data } = await api.get('/v1/refunds/vox');
	return refundRowSchema.array().parse(data);
}
