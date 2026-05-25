import { api } from '@/shared/lib/fetch';
import {
	type AdjustVoxesPayload,
	type AdjustVoxesResponse,
	adjustVoxesResponseSchema,
	type CreateVoxPackagePayload,
	type MyVoxesResponse,
	myVoxesResponseSchema,
	type PurchaseVoxesPayload,
	type PurchaseVoxesResponse,
	purchaseVoxesResponseSchema,
	type UpdateVoxPackagePayload,
	type VoxPackage,
	voxPackageSchema,
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
