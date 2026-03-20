import { z } from 'zod';
import { api } from '@/lib/fetch';
import {
	type CreatePromoLinkPayload,
	type CreatePromoLinkResponse,
	createPromoLinkResponseSchema,
	type PromoLinkInfo,
	type PromoLinkListItem,
	promoLinkInfoSchema,
	promoLinkListItemSchema,
	type RedeemPromoLinkPayload,
	type RedeemPromoLinkResponse,
	redeemPromoLinkResponseSchema,
} from '@/types/promo-link';

export async function createPromoLink(
	payload: CreatePromoLinkPayload,
): Promise<CreatePromoLinkResponse> {
	const { data } = await api.post('/promo-link', payload);
	return createPromoLinkResponseSchema.parse(data);
}

export async function getPromoLinkInfo(token: string): Promise<PromoLinkInfo> {
	const { data } = await api.get(`/promo-link/${token}`);
	return promoLinkInfoSchema.parse(data);
}

export async function redeemPromoLink(
	token: string,
	payload: RedeemPromoLinkPayload,
): Promise<RedeemPromoLinkResponse> {
	const { data } = await api.post(`/promo-link/${token}/redeem`, payload);
	return redeemPromoLinkResponseSchema.parse(data);
}

export async function listPromoLinks(): Promise<PromoLinkListItem[]> {
	const { data } = await api.get('/promo-links');
	return z.array(promoLinkListItemSchema).parse(data);
}

export async function togglePromoLinkStatus(
	id: string,
	status: 'active' | 'inactive',
): Promise<void> {
	await api.patch(`/promo-link/${id}/status`, { status });
}
