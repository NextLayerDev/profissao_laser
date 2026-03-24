import { api } from '@/lib/fetch';
import type { UpdateCustomerPayload } from '@/types/auth';

export async function updateCustomer(
	id: string,
	payload: UpdateCustomerPayload,
): Promise<void> {
	await api.patch(`/customer/${id}`, payload);
}
