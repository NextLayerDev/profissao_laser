import { api } from '@/shared/lib/fetch';
import {
	type AnalyticsSalesParams,
	type AnalyticsSalesResponse,
	type AnalyticsSummary,
	type AnalyticsSummaryParams,
	analyticsSalesResponseSchema,
	analyticsSummarySchema,
} from '@/types/analytics';

function buildQuery(
	params: Record<string, string | number | boolean | string[] | undefined>,
): string {
	const qs = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === '') continue;
		if (Array.isArray(value)) {
			for (const v of value) qs.append(key, v);
		} else {
			qs.set(key, String(value));
		}
	}
	const str = qs.toString();
	return str ? `?${str}` : '';
}

export async function getAnalyticsSales(
	params: AnalyticsSalesParams = {},
): Promise<AnalyticsSalesResponse> {
	const { data } = await api.get(
		`/v1/admin/analytics/sales${buildQuery(params as Record<string, string | number | boolean | string[] | undefined>)}`,
	);
	return analyticsSalesResponseSchema.parse(data);
}

export async function getAnalyticsSummary(
	params: AnalyticsSummaryParams = {},
): Promise<AnalyticsSummary> {
	const { data } = await api.get(
		`/v1/admin/analytics/sales/summary${buildQuery(params as Record<string, string | number | boolean | string[] | undefined>)}`,
	);
	return analyticsSummarySchema.parse(data);
}
