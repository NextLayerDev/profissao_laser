import { api } from '@/shared/lib/fetch';
import { type Me, meSchema, type UpdateMePayload } from '../types/me';

export async function getMe(): Promise<Me> {
	const { data } = await api.get('/v1/me');
	return meSchema.parse(data);
}

export async function updateMe(payload: UpdateMePayload): Promise<Me> {
	const { data } = await api.patch('/v1/me', payload);
	return meSchema.parse(data);
}
