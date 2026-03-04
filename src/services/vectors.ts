import { api } from '@/lib/fetch';

export interface CustomerVector {
	id: string;
	customer_id?: string;
	original_name: string;
	original_url?: string | null;
	svg_url: string;
	created_at: string;
	updated_at?: string;
}

export interface VectorsResponse {
	data: CustomerVector[];
	total: number;
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
	search?: string;
	customerId?: string;
}): Promise<VectorsResponse> {
	const { data } = await api.get<VectorsResponse>('/customer/vectors', {
		params: params ?? undefined,
	});
	return data ?? { data: [], total: 0 };
}

export async function getVectorById(id: string): Promise<CustomerVector> {
	const { data } = await api.get<CustomerVector>(
		`/customer/vectors/${encodeURIComponent(id)}`,
	);
	return data as CustomerVector;
}

export async function updateVector(
	id: string,
	payload: { originalName?: string; svgContent?: string },
): Promise<CustomerVector> {
	const { data } = await api.patch<CustomerVector>(
		`/customer/vectors/${encodeURIComponent(id)}`,
		payload,
	);
	return data as CustomerVector;
}

export async function deleteCustomerVector(id: string): Promise<void> {
	await api.delete(`/customer/vectors/${encodeURIComponent(id)}`);
}
