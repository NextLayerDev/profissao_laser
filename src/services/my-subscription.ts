import { isAxiosError } from 'axios';
import { api } from '@/lib/fetch';
import {
	type MySubscription,
	mySubscriptionSchema,
} from '@/types/my-subscription';

export async function getMySubscription(): Promise<MySubscription | null> {
	try {
		const { data } = await api.get('/me/subscription');
		return mySubscriptionSchema.parse(data);
	} catch (error) {
		if (isAxiosError(error) && error.response?.status === 404) return null;
		throw error;
	}
}

export async function cancelMySubscription(): Promise<void> {
	await api.post('/me/subscription/cancel');
}
