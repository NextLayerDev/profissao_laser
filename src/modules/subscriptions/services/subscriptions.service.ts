import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type ChangeSubscriptionPayload,
	type CheckoutResponse,
	type CreateSubscriptionPayload,
	checkoutResponseSchema,
	type Subscription,
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
