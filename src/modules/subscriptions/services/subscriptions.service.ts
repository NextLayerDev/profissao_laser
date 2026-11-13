import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type BillingPortalResponse,
	billingPortalResponseSchema,
	type ChangeSubscriptionPayload,
	type CheckoutResponse,
	type CreateSubscriptionPayload,
	checkoutResponseSchema,
	type PlanChangePayload,
	type PlanChangePreview,
	type PlanChangeResult,
	planChangePreviewSchema,
	planChangeResultSchema,
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

/** Quanto a troca custa agora (ou quando vale, se for para a renovação). */
export async function previewPlanChange(
	id: string,
	payload: PlanChangePayload,
): Promise<PlanChangePreview> {
	const { data } = await api.post(
		`/v1/subscription/${id}/change/preview`,
		payload,
	);
	return planChangePreviewSchema.parse(data);
}

/** Confirma a troca: cobra a diferença no cartão ou agenda para a renovação. */
export async function changePlan(
	id: string,
	payload: PlanChangePayload,
): Promise<PlanChangeResult> {
	const { data } = await api.post(`/v1/subscription/${id}/change`, payload);
	return planChangeResultSchema.parse(data);
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
