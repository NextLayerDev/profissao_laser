import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type CreateSubscriptionPayload,
	type Subscription,
	type SubscriptionChangePayload,
	type SubscriptionChangeResponse,
	subscriptionChangeResponseSchema,
	subscriptionSchema,
} from '../types/subscriptions';

/** Cria a assinatura Stripe do customer. `POST /subscription`. */
export async function createSubscription(
	payload: CreateSubscriptionPayload,
): Promise<void> {
	await api.post('/subscription', payload);
}

/** Upgrade do plano atual. `POST /subscription/upgrade`. */
export async function upgradeSubscription(
	payload: SubscriptionChangePayload,
): Promise<SubscriptionChangeResponse> {
	const { data } = await api.post('/subscription/upgrade', payload);
	return subscriptionChangeResponseSchema.parse(data);
}

/** Downgrade do plano atual. `POST /subscription/downgrade`. */
export async function downgradeSubscription(
	payload: SubscriptionChangePayload,
): Promise<SubscriptionChangeResponse> {
	const { data } = await api.post('/subscription/downgrade', payload);
	return subscriptionChangeResponseSchema.parse(data);
}

/** Cancela uma assinatura pelo id (read/cancel path upvox). */
export async function cancelSubscription(id: string): Promise<Subscription> {
	const { data } = await api.post(`/v1/subscription/${id}/cancel`);
	return subscriptionSchema.parse(data);
}

/** Assinaturas do customer logado. `GET /v1/me/subscriptions`. */
export async function listMySubscriptions(): Promise<Subscription[]> {
	const { data } = await api.get('/v1/me/subscriptions');
	return subscriptionSchema.array().parse(data);
}
