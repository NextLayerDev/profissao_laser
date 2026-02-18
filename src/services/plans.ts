import { api } from '@/lib/fetch';
import {
	type CustomerPlansResponse,
	customerPlansResponseSchema,
} from '@/types/plans';

export async function getCustomerPlans(
	email: string,
): Promise<CustomerPlansResponse> {
	const { data } = await api.get(
		`/customer/plans/${encodeURIComponent(email)}`,
	);
	return customerPlansResponseSchema.parse(data);
}
