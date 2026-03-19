import { api } from '@/lib/fetch';
import {
	type CreatePaymentLinkPayload,
	type CreatePaymentLinkResponse,
	createPaymentLinkResponseSchema,
	type PaymentLinkInfo,
	paymentLinkInfoSchema,
	type RedeemPaymentLinkPayload,
	type RedeemPaymentLinkResponse,
	redeemPaymentLinkResponseSchema,
} from '@/types/payment-link';

export async function createPaymentLink(
	payload: CreatePaymentLinkPayload,
): Promise<CreatePaymentLinkResponse> {
	const { data } = await api.post('/payment-link', payload);
	return createPaymentLinkResponseSchema.parse(data);
}

export async function getPaymentLinkInfo(
	token: string,
): Promise<PaymentLinkInfo> {
	const { data } = await api.get(`/payment-link/${token}`);
	return paymentLinkInfoSchema.parse(data);
}

export async function redeemPaymentLink(
	token: string,
	payload: RedeemPaymentLinkPayload,
): Promise<RedeemPaymentLinkResponse> {
	const { data } = await api.post(`/payment-link/${token}/redeem`, payload);
	return redeemPaymentLinkResponseSchema.parse(data);
}
