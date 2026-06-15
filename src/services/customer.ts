import { api } from '@/lib/fetch';
import { apiCourses } from '@/shared/lib/api-courses';
import type { UpdateCustomerPayload } from '@/types/auth';
import { type Customer, customerSchema } from '@/types/customer';

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
	await apiCourses.delete(`/v1/user/${id}`);
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

/** Marca/desmarca um customer como conta de teste ilimitada (admin). */
export async function setCustomerTestUnlimited(
	id: string,
	unlimited: boolean,
): Promise<void> {
	await api.patch(`/customer/${id}/test-unlimited`, { unlimited });
}
