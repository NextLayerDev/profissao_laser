import { api } from '@/shared/lib/fetch';
import type {
	CreateLaserProductPayload,
	CreateLaserProductVariantPayload,
	LaserProduct,
	LaserProductsParams,
	LaserProductsResponse,
	LaserProductVariant,
	UpdateLaserProductPayload,
	UpdateLaserProductVariantPayload,
} from '@/types/laser-products';

// ─── Products ───────────────────────────────────────────────────────────────

export async function getLaserProducts(
	params?: LaserProductsParams,
): Promise<LaserProductsResponse> {
	const { data } = await api.get<LaserProductsResponse>('/laser-products', {
		params,
	});
	return data ?? { data: [], total: 0, page: 1, limit: 20 };
}

export async function getLaserProduct(id: string): Promise<LaserProduct> {
	const { data } = await api.get<LaserProduct>(`/laser-products/${id}`);
	return data;
}

export async function createLaserProduct(
	payload: CreateLaserProductPayload,
): Promise<LaserProduct> {
	const { data } = await api.post<LaserProduct>('/laser-products', payload);
	return data;
}

export async function updateLaserProduct(
	id: string,
	payload: UpdateLaserProductPayload,
): Promise<LaserProduct> {
	const { data } = await api.patch<LaserProduct>(
		`/laser-products/${id}`,
		payload,
	);
	return data;
}

export async function deleteLaserProduct(id: string): Promise<void> {
	await api.delete(`/laser-products/${id}`);
}

// ─── Variants ───────────────────────────────────────────────────────────────

export async function getLaserProductVariants(
	productId: string,
): Promise<LaserProductVariant[]> {
	const { data } = await api.get<LaserProductVariant[]>(
		`/laser-products/${productId}/variants`,
	);
	return Array.isArray(data) ? data : [];
}

export async function createLaserProductVariant(
	productId: string,
	payload: CreateLaserProductVariantPayload,
): Promise<LaserProductVariant> {
	const { data } = await api.post<LaserProductVariant>(
		`/laser-products/${productId}/variants`,
		payload,
	);
	return data;
}

export async function updateLaserProductVariant(
	productId: string,
	variantId: string,
	payload: UpdateLaserProductVariantPayload,
): Promise<LaserProductVariant> {
	const { data } = await api.patch<LaserProductVariant>(
		`/laser-products/${productId}/variants/${variantId}`,
		payload,
	);
	return data;
}

export async function deleteLaserProductVariant(
	productId: string,
	variantId: string,
): Promise<void> {
	await api.delete(`/laser-products/${productId}/variants/${variantId}`);
}

export async function uploadLaserProductVariantImage(
	productId: string,
	variantId: string,
	file: File,
): Promise<LaserProductVariant> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post<LaserProductVariant>(
		`/laser-products/${productId}/variants/${variantId}/image`,
		fd,
	);
	return data;
}

export async function uploadLaserProductImage(
	id: string,
	file: File,
): Promise<LaserProduct> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post<LaserProduct>(
		`/laser-products/${id}/image`,
		fd,
	);
	return data;
}
