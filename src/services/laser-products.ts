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
	const { data } = await api.get<LaserProductsResponse>('/v1/laser-products', {
		params,
	});
	return data ?? { data: [], total: 0, page: 1, limit: 20 };
}

export async function getLaserProduct(id: string): Promise<LaserProduct> {
	const { data } = await api.get<LaserProduct>(`/v1/laser-product/${id}`);
	return data;
}

export async function createLaserProduct(
	payload: CreateLaserProductPayload,
): Promise<LaserProduct> {
	const { data } = await api.post<LaserProduct>('/v1/laser-products', payload);
	return data;
}

export async function updateLaserProduct(
	id: string,
	payload: UpdateLaserProductPayload,
): Promise<LaserProduct> {
	const { data } = await api.patch<LaserProduct>(
		`/v1/laser-product/${id}`,
		payload,
	);
	return data;
}

export async function deleteLaserProduct(id: string): Promise<void> {
	await api.delete(`/v1/laser-product/${id}`);
}

// ─── Variants ───────────────────────────────────────────────────────────────

export async function getLaserProductVariants(
	productId: string,
): Promise<LaserProductVariant[]> {
	const { data } = await api.get<LaserProductVariant[]>(
		`/v1/laser-product/${productId}/variants`,
	);
	return Array.isArray(data) ? data : [];
}

export async function createLaserProductVariant(
	productId: string,
	payload: CreateLaserProductVariantPayload,
): Promise<LaserProductVariant> {
	const { data } = await api.post<LaserProductVariant>(
		`/v1/laser-product/${productId}/variants`,
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
		`/v1/laser-product/${productId}/variants/${variantId}`,
		payload,
	);
	return data;
}

export async function deleteLaserProductVariant(
	productId: string,
	variantId: string,
): Promise<void> {
	await api.delete(`/v1/laser-product/${productId}/variants/${variantId}`);
}

export async function uploadLaserProductVariantImage(
	productId: string,
	variantId: string,
	file: File,
): Promise<LaserProductVariant> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post<LaserProductVariant>(
		`/v1/laser-product/${productId}/variants/${variantId}/image`,
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
		`/v1/laser-product/${id}/image`,
		fd,
	);
	return data;
}
