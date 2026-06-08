import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type AdjustVoxesPayload,
	type AdjustVoxesResponse,
	adjustVoxesResponseSchema,
	type CreateVoxPackagePayload,
	type ListVoxSalesParams,
	type MyVoxesResponse,
	myVoxesResponseSchema,
	type PurchaseVoxesPayload,
	type PurchaseVoxesResponse,
	purchaseVoxesResponseSchema,
	type UpdateVoxPackagePayload,
	type VoxPackage,
	type VoxSale,
	voxPackageSchema,
	voxSaleSchema,
} from '../types/voxes';

export async function listVoxPackages(): Promise<VoxPackage[]> {
	const { data } = await api.get('/v1/voxes/packages');
	return voxPackageSchema.array().parse(data);
}

export async function getMyVoxes(): Promise<MyVoxesResponse> {
	const { data } = await api.get('/v1/me/voxes');
	return myVoxesResponseSchema.parse(data);
}

export async function purchaseVoxes(
	payload: PurchaseVoxesPayload,
): Promise<PurchaseVoxesResponse> {
	const { data } = await api.post('/v1/voxes/purchase', payload);
	return purchaseVoxesResponseSchema.parse(data);
}

// ─── Admin ──────────────────────────────────────────────

export async function listAllVoxPackages(): Promise<VoxPackage[]> {
	const { data } = await api.get('/v1/voxes/packages/all');
	return voxPackageSchema.array().parse(data);
}

export async function createVoxPackage(
	payload: CreateVoxPackagePayload,
): Promise<VoxPackage> {
	const { data } = await api.post('/v1/voxes/package', payload);
	return voxPackageSchema.parse(data);
}

export async function updateVoxPackage(
	id: string,
	payload: UpdateVoxPackagePayload,
): Promise<VoxPackage> {
	const { data } = await api.patch(`/v1/voxes/package/${id}`, payload);
	return voxPackageSchema.parse(data);
}

export async function adjustVoxes(
	payload: AdjustVoxesPayload,
): Promise<AdjustVoxesResponse> {
	const { data } = await api.post('/v1/voxes/adjust', payload);
	return adjustVoxesResponseSchema.parse(data);
}

/** Vendas de pacotes de voxxys (admin). Paginação por offset/limit. */
export async function listVoxSales(
	params: ListVoxSalesParams = {},
): Promise<VoxSale[]> {
	const { from, to, limit = 50, offset = 0 } = params;
	// `from`/`to` só vão na query quando preenchidos — o backend rejeita
	// string vazia com "Invalid ISO datetime".
	const query: Record<string, string | number> = { limit, offset };
	if (from) query.from = from;
	if (to) query.to = to;
	const { data } = await api.get('/v1/voxes/sales', { params: query });
	return voxSaleSchema.array().parse(data);
}
