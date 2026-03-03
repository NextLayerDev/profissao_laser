import { api } from '@/lib/fetch';
import { type UpdateUserPayload, type User, userSchema } from '@/types/users';

export async function getUsers(): Promise<User[]> {
	const { data } = await api.get('/users');
	return userSchema.array().parse(data);
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
