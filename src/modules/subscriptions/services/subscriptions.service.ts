import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type BillingPortalResponse,
	billingPortalResponseSchema,
	type ChangeSubscriptionPayload,
	type CheckoutResponse,
	type CreateSubscriptionPayload,
	checkoutResponseSchema,
	type Subscription,
	type SubscriptionRefundResult,
	subscriptionRefundResultSchema,
	subscriptionSchema,
} from '../types/subscriptions';

/** Inicia checkout de assinatura; retorna a URL do Stripe. */
export async function createSubscription(
	payload: CreateSubscriptionPayload,
): Promise<CheckoutResponse> {
	const { data } = await api.post('/v1/subscription', payload);
	return checkoutResponseSchema.parse(data);
}

export async function upgradeSubscription(
	id: string,
	payload: ChangeSubscriptionPayload,
): Promise<Subscription> {
	const { data } = await api.post(`/v1/subscription/${id}/upgrade`, payload);
	return subscriptionSchema.parse(data);
}

export async function downgradeSubscription(
	id: string,
	payload: ChangeSubscriptionPayload,
): Promise<Subscription> {
	const { data } = await api.post(`/v1/subscription/${id}/downgrade`, payload);
	return subscriptionSchema.parse(data);
}

export async function cancelSubscription(id: string): Promise<Subscription> {
	const { data } = await api.post(`/v1/subscription/${id}/cancel`);
	return subscriptionSchema.parse(data);
}

export async function listMySubscriptions(): Promise<Subscription[]> {
	const { data } = await api.get('/v1/me/subscriptions');
	return subscriptionSchema.array().parse(data);
}

/** Estorna integralmente (dentro da garantia de 7 dias) e cancela na hora. */
export async function refundSubscription(
	id: string,
): Promise<SubscriptionRefundResult> {
	const { data } = await api.post(`/v1/subscription/${id}/refund`);
	return subscriptionRefundResultSchema.parse(data);
}

/** Cria uma sessão do Stripe Customer Portal p/ trocar a forma de pagamento. */
export async function getBillingPortalUrl(): Promise<BillingPortalResponse> {
	const { data } = await api.post('/v1/me/billing-portal');
	return billingPortalResponseSchema.parse(data);
}
