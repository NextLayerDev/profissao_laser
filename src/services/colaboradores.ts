import { api } from '@/lib/fetch';
import { type User, userSchema } from '@/types/users';

export interface UpdateColaboradorPayload {
	name?: string;
	email?: string;
	role?: string;
	Permissions?: number | null;
}

export async function updateColaborador(
	id: string,
	payload: UpdateColaboradorPayload,
): Promise<User> {
	const { data } = await api.patch(`/colaborador/${id}`, payload);
	return userSchema.parse(data);
}

export async function deleteColaborador(id: string): Promise<void> {
	await api.delete(`/colaborador/${id}`);
}
