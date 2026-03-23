import { z } from 'zod';
import { api } from '@/lib/fetch';
import {
	type CreateGlobalPromoLinkPayload,
	type CreateGlobalPromoLinkResponse,
	createGlobalPromoLinkResponseSchema,
	type GlobalPromoLinkInfo,
	type GlobalPromoLinkListItem,
	globalPromoLinkInfoSchema,
	globalPromoLinkListItemSchema,
	type RedeemGlobalPromoLinkPayload,
	type RedeemGlobalPromoLinkResponse,
	redeemGlobalPromoLinkResponseSchema,
} from '@/types/global-promo-link';

export async function createGlobalPromoLink(
	payload: CreateGlobalPromoLinkPayload,
): Promise<CreateGlobalPromoLinkResponse> {
	const { data } = await api.post('/global-promo-link', payload);
	return createGlobalPromoLinkResponseSchema.parse(data);
}

export async function getGlobalPromoLinkInfo(
	token: string,
): Promise<GlobalPromoLinkInfo> {
	const { data } = await api.get(`/global-promo-link/${token}`);
	return globalPromoLinkInfoSchema.parse(data);
}

export async function redeemGlobalPromoLink(
	token: string,
	payload: RedeemGlobalPromoLinkPayload,
): Promise<RedeemGlobalPromoLinkResponse> {
	const { data } = await api.post(
		`/global-promo-link/${token}/redeem`,
		payload,
	);
	return redeemGlobalPromoLinkResponseSchema.parse(data);
}

export async function listGlobalPromoLinks(): Promise<
	GlobalPromoLinkListItem[]
> {
	const { data } = await api.get('/global-promo-links');
	return z.array(globalPromoLinkListItemSchema).parse(data);
}

export async function toggleGlobalPromoLinkStatus(
	id: string,
	status: 'active' | 'inactive',
): Promise<void> {
	await api.patch(`/global-promo-link/${id}/status`, { status });
}
