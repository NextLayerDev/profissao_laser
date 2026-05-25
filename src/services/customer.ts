import { api } from '@/shared/lib/fetch';
import {
	type Customer,
	customerSchema,
	type UpdateCustomerPayload,
} from '@/types/customer';

export async function updateCustomer(
	id: string,
	payload: UpdateCustomerPayload,
): Promise<void> {
	await api.patch(`/customer/${id}`, payload);
}

export async function getCustomers(): Promise<Customer[]> {
	const { data } = await api.get('/customers');
	return customerSchema.array().parse(data);
}

export async function deleteCustomer(id: string): Promise<void> {
	await api.delete('/customer', { data: { id } });
}

export async function blockCustomer(
	id: string,
	blocked: boolean,
): Promise<void> {
	await api.patch(`/customer/${id}/block`, { blocked });
}

export async function updateCustomerPassword(
	id: string,
	password: string,
): Promise<void> {
	await api.patch(`/customer/${id}/password`, { password });
}
