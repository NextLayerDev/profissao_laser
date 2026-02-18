import { api } from '@/lib/fetch';
import type { CreateSubscriptionPayload } from '@/types/subscription';

export async function createSubscription(
	payload: CreateSubscriptionPayload,
): Promise<void> {
	await api.post('/subscription', payload);
}
