import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type ChangePasswordPayload,
	type Me,
	meSchema,
	type Streak,
	streakSchema,
	type UpdateMePayload,
} from '../types/account';

export async function getMe(): Promise<Me> {
	const { data } = await api.get('/v1/me');
	return meSchema.parse(data);
}

export async function updateMe(payload: UpdateMePayload): Promise<Me> {
	const { data } = await api.patch('/v1/me', payload);
	return meSchema.parse(data);
}

export async function changeMyPassword(
	payload: ChangePasswordPayload,
): Promise<void> {
	await api.patch('/v1/me/password', payload);
}

export async function getMyStreak(): Promise<Streak> {
	const { data } = await api.get('/v1/me/streak');
	return streakSchema.parse(data);
}
