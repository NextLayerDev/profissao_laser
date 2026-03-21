import { api } from '@/lib/fetch';
import type { CreateSubscriptionPayload } from '@/types/subscription';
import {
	type SubscriptionChangePayload,
	type SubscriptionChangeResponse,
	subscriptionChangeResponseSchema,
} from '@/types/subscription-change';

export async function createSubscription(
	payload: CreateSubscriptionPayload,
): Promise<void> {
	await api.post('/subscription', payload);
}

export async function upgradeSubscription(
	payload: SubscriptionChangePayload,
): Promise<SubscriptionChangeResponse> {
	const { data } = await api.post('/subscription/upgrade', payload);
	return subscriptionChangeResponseSchema.parse(data);
}

export async function downgradeSubscription(
	payload: SubscriptionChangePayload,
): Promise<SubscriptionChangeResponse> {
	const { data } = await api.post('/subscription/downgrade', payload);
	return subscriptionChangeResponseSchema.parse(data);
}
