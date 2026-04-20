import { api } from '@/lib/fetch';
import {
	type RecurringSubscription,
	recurringSubscriptionSchema,
	type Sales,
	salesSchema,
} from '@/types/sales';

export async function getSales(): Promise<Sales[]> {
	const { data } = await api.get('/sales');
	return salesSchema.array().parse(data);
}

export async function getSalesAttempts(): Promise<Sales[]> {
	const { data } = await api.get('/sales/attempts');
	return salesSchema.array().parse(data);
}

export interface GetRecurringParams {
	status?: 'active' | 'trialing' | 'all';
	limit?: number;
	starting_after?: string;
}

export async function getRecurringSales(
	params: GetRecurringParams = {},
): Promise<RecurringSubscription[]> {
	const { data } = await api.get('/sales/recurring', { params });
	return recurringSubscriptionSchema.array().parse(data);
}
