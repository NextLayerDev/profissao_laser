import { api } from '@/lib/fetch';
import {
	type AdjustVoxPayload,
	type CreateVoxPackagePayload,
	type QuotaResponse,
	quotaResponseSchema,
	type UpdateVoxPackagePayload,
	type VoxBalance,
	type VoxCheckoutResponse,
	type VoxCost,
	type VoxFeature,
	type VoxHistoryResponse,
	type VoxPackage,
	voxBalanceSchema,
	voxCheckoutResponseSchema,
	voxCostSchema,
	voxHistoryResponseSchema,
	voxPackageSchema,
} from '@/types/credits';

// ─── Cliente ────────────────────────────────────────────────────────────────

export async function getVoxBalance(): Promise<VoxBalance> {
	const { data } = await api.get('/credits/balance');
	return voxBalanceSchema.parse(data);
}

export async function getVoxCosts(): Promise<VoxCost[]> {
	const { data } = await api.get('/credits/costs');
	return voxCostSchema.array().parse(data);
}

export async function getVoxQuotas(): Promise<QuotaResponse> {
	const { data } = await api.get('/credits/quota');
	return quotaResponseSchema.parse(data);
}

export async function getVoxPackages(): Promise<VoxPackage[]> {
	const { data } = await api.get('/credits/packages');
	return voxPackageSchema.array().parse(data);
}

export async function getVoxHistory(params?: {
	page?: number;
	limit?: number;
}): Promise<VoxHistoryResponse> {
	const { data } = await api.get('/credits/history', { params });
	return voxHistoryResponseSchema.parse(
		data ?? { data: [], total: 0, page: 1, limit: 20 },
	);
}

export async function createVoxCheckout(
	packageId: string,
): Promise<VoxCheckoutResponse> {
	const { data } = await api.post('/credits/checkout', { packageId });
	return voxCheckoutResponseSchema.parse(data);
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function getAllVoxPackages(): Promise<VoxPackage[]> {
	const { data } = await api.get('/credits/packages/all');
	return voxPackageSchema.array().parse(data);
}

export async function createVoxPackage(
	payload: CreateVoxPackagePayload,
): Promise<VoxPackage> {
	const { data } = await api.post('/credits/packages', payload);
	return voxPackageSchema.parse(data);
}

export async function updateVoxPackage(
	id: string,
	payload: UpdateVoxPackagePayload,
): Promise<VoxPackage> {
	const { data } = await api.put(`/credits/packages/${id}`, payload);
	return voxPackageSchema.parse(data);
}

export async function setVoxPackageStatus(
	id: string,
	active: boolean,
): Promise<void> {
	await api.patch(`/credits/packages/${id}/status`, { active });
}

export async function updateVoxCost(
	feature: VoxFeature,
	cost: number,
): Promise<void> {
	await api.put(`/credits/costs/${feature}`, { cost });
}

export async function adjustVox(payload: AdjustVoxPayload): Promise<void> {
	await api.post('/credits/adjust', payload);
}
