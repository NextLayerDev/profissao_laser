import { api } from '@/lib/fetch';
import { getEntitlements } from '@/modules/subscriptions';
import { apiCourses } from '@/shared/lib/api-courses';
import {
	type AdjustVoxPayload,
	type CreateVoxPackagePayload,
	type QuotaResponse,
	type UpdateVoxPackagePayload,
	type VoxBalance,
	type VoxCheckoutResponse,
	type VoxCost,
	type VoxFeature,
	type VoxHistoryResponse,
	type VoxPackage,
	voxPackageSchema,
} from '@/types/credits';

// ─── Cliente (upvox) ──────────────────────────────────────────────────────────
// Tudo vem do upvox agora (os endpoints /credits/* do main API foram removidos).
// As assinaturas/shapes são mantidas para os consumidores existentes (shim);
// a reescrita das telas de ferramenta para o fluxo invoke→motor é o PR3.

/** Conta de teste ilimitada — de entitlements.is_test_unlimited. */
export async function getMeUnlimited(): Promise<{ unlimited: boolean }> {
	const ent = await getEntitlements();
	return { unlimited: ent.is_test_unlimited };
}

/** Saldo de voxxys — de GET /v1/me/voxes. */
export async function getVoxBalance(): Promise<VoxBalance> {
	const { data } = await apiCourses.get('/v1/me/voxes');
	return { balance: (data as { balance?: number })?.balance ?? 0 };
}

/** Custos por ferramenta — de entitlements.tools[].vox_cost. */
export async function getVoxCosts(): Promise<VoxCost[]> {
	const ent = await getEntitlements();
	return ent.tools.map((t) => ({
		feature: t.key,
		cost: t.vox_cost,
		label: t.name,
	}));
}

/**
 * Cota grátis — agora 100% pelo plano (free_quota por ferramenta), sem free-tier
 * global. O banner global (balance==0) sai no PR3; aqui retornamos quotas vazias.
 */
export async function getVoxQuotas(): Promise<QuotaResponse> {
	const ent = await getEntitlements();
	return { balance: ent.vox_balance, quotas: [] };
}

/** Histórico — o ledger real está em modules/voxes (use-my-voxes); shim vazio. */
export async function getVoxHistory(params?: {
	page?: number;
	limit?: number;
}): Promise<VoxHistoryResponse> {
	return {
		data: [],
		total: 0,
		page: params?.page ?? 1,
		limit: params?.limit ?? 20,
	};
}

/** Compra de voxxys — POST /v1/voxes/purchase. */
export async function createVoxCheckout(
	packageId: string,
): Promise<VoxCheckoutResponse> {
	const { data } = await apiCourses.post('/v1/voxes/purchase', {
		package_id: packageId,
	});
	return {
		checkoutUrl: (data as { checkout_url?: string })?.checkout_url ?? '',
		sessionId: '',
	};
}

/** Pacotes de voxxys publicados — GET /v1/voxes/packages (mapeado p/ o shape antigo). */
export async function getVoxPackages(): Promise<VoxPackage[]> {
	const { data } = await apiCourses.get('/v1/voxes/packages');
	const arr =
		(data as Array<{
			id: string;
			name: string;
			vox_amount: number;
			price_cents: number;
			published?: boolean;
		}>) ?? [];
	return arr.map((p) => ({
		id: p.id,
		name: p.name,
		credits: p.vox_amount,
		price: p.price_cents / 100,
		active: p.published ?? true,
	}));
}

// ─── Admin ────────────────────────────────────────────────────────────────────
// TODO(PR follow-up): migrar a UI admin de voxxys para `src/modules/voxes`
// (/v1/voxes/*). Estas ainda apontam para o main API (/credits/*, removido).

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
