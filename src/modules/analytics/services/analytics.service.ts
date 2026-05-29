import { apiCourses as api } from '@/shared/lib/api-courses';
import {
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
