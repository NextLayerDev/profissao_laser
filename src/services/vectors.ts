import { api } from '@/lib/fetch';

export interface CustomerVector {
	id: string;
	original_name: string;
	original_url?: string;
	svg_url: string;
	created_at: string;
}

export async function saveVector(
	svgContent: string,
	originalName: string,
): Promise<CustomerVector> {
	const { data } = await api.post<CustomerVector>('/customer/vectors', {
		svgContent,
		originalName,
	});
	return data as CustomerVector;
}

export async function getCustomerVectors(params?: {
	page?: number;
	limit?: number;
}): Promise<CustomerVector[]> {
	const { data } = await api.get<CustomerVector[]>('/customer/vectors', {
		params: params ? { page: params.page, limit: params.limit } : undefined,
	});
	return data ?? [];
}

export async function deleteCustomerVector(id: string): Promise<void> {
	await api.delete(`/customer/vectors/${encodeURIComponent(id)}`);
}
