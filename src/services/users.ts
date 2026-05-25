import { api } from '@/shared/lib/fetch';
import { type UpdateUserPayload, type User, userSchema } from '@/types/users';

export async function getUsers(): Promise<User[]> {
	const { data } = await api.get('/users');
	return userSchema.array().parse(data);
}

export async function getUsersFiltered(
	role?: 'admin' | 'staff' | 'customer',
): Promise<User[]> {
	const params = new URLSearchParams({ limit: '100' });
	if (role) params.set('role', role);
	const { data } = await api.get(`/v1/users?${params.toString()}`);
	return userSchema.array().parse(data);
}

export async function blockUser(id: string, blocked: boolean): Promise<User> {
	const { data } = await api.patch(`/v1/user/${id}/block`, { blocked });
	return userSchema.parse(data);
}

export async function changeUserPassword(
	id: string,
	new_password: string,
): Promise<void> {
	await api.patch(`/v1/user/${id}/password`, { new_password });
}

export async function promoteUser(
	id: string,
	role: 'staff' | 'admin',
): Promise<User> {
	const { data } = await api.post(`/v1/user/${id}/promote`, { role });
	return userSchema.parse(data);
}

export async function demoteUser(
	id: string,
	role: 'staff' | 'customer',
): Promise<User> {
	const { data } = await api.post(`/v1/user/${id}/demote`, { role });
	return userSchema.parse(data);
}

export async function getUser(id: string): Promise<User> {
	const { data } = await api.get(`/user/${id}`);
	return userSchema.parse(data);
}

export async function updateUser(
	id: string,
	payload: UpdateUserPayload,
): Promise<User> {
	const { data } = await api.patch(`/user/${id}`, payload);
	return userSchema.parse(data);
}

export async function updateUserPassword(
	id: string,
	password: string,
): Promise<User> {
	const { data } = await api.patch(`/user/${id}`, { password });
	return userSchema.parse(data);
}

export async function deleteUser(id: string): Promise<void> {
	await api.delete(`/user/${id}`);
}
