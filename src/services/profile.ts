import { api } from '@/lib/fetch';
import type {
	ChangePasswordPayload,
	MyProfile,
	UpdateProfilePayload,
} from '@/types/profile';

export async function getMyProfile(): Promise<MyProfile> {
	const { data } = await api.get<MyProfile>('/me/profile');
	return data;
}

export async function updateMyProfile(
	payload: UpdateProfilePayload,
): Promise<MyProfile> {
	const { data } = await api.patch<MyProfile>('/me/profile', payload);
	return data;
}

export async function uploadMyAvatar(file: File): Promise<{ avatar: string }> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post<{ avatar: string }>('/me/avatar', fd);
	return data;
}

export async function removeMyAvatar(): Promise<{ avatar: string | null }> {
	const { data } = await api.delete<{ avatar: string | null }>('/me/avatar');
	return data;
}

export async function uploadMyBanner(file: File): Promise<{ banner: string }> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post<{ banner: string }>('/me/banner', fd);
	return data;
}

export async function removeMyBanner(): Promise<{ banner: string | null }> {
	const { data } = await api.delete<{ banner: string | null }>('/me/banner');
	return data;
}

export async function changeMyPassword(
	payload: ChangePasswordPayload,
): Promise<void> {
	await api.patch('/me/password', payload);
}
