import { z } from 'zod';
import { api } from '@/lib/fetch';
import type { CreateSubscriptionPayload } from '@/types/subscription';
import {
	type SubscriptionChangePayload,
	type SubscriptionChangeResponse,
	subscriptionChangeResponseSchema,
} from '@/types/subscription-change';

export const cancelSubscriptionResponseSchema = z.object({
	id: z.string(),
	message: z.string(),
	cancelAtPeriodEnd: z.boolean(),
	currentPeriodEnd: z.string(),
});

export type CancelSubscriptionResponse = z.infer<
	typeof cancelSubscriptionResponseSchema
>;

export interface CancelSubscriptionPayload {
	email: string;
	subscriptionId: string;
}

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

export async function adminChangePlan(
	customerId: string,
	payload: SubscriptionChangePayload,
): Promise<SubscriptionChangeResponse> {
	const { data } = await api.patch(
		`/customer/${customerId}/subscription`,
		payload,
	);
	return subscriptionChangeResponseSchema.parse(data);
}

export async function cancelSubscription(
	payload: CancelSubscriptionPayload,
): Promise<CancelSubscriptionResponse> {
	const { data } = await api.post('/customer/subscription/cancel', payload);
	return cancelSubscriptionResponseSchema.parse(data);
}
