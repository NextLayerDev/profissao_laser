import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type AppUser,
	appUserSchema,
	type ListUsersParams,
	type UserRole,
} from '../types/users';

export async function listUsers(
	params: ListUsersParams = {},
): Promise<AppUser[]> {
	const { data } = await api.get('/v1/users', { params });
	return appUserSchema.array().parse(data);
}

export async function listTeamUsers(): Promise<AppUser[]> {
	const { data } = await api.get('/v1/admin/team');
	return appUserSchema.array().parse(data);
}

export async function getUser(id: string): Promise<AppUser> {
	const { data } = await api.get(`/v1/user/${id}`);
	return appUserSchema.parse(data);
}

export async function updateUserRole(
	id: string,
	role: UserRole,
): Promise<AppUser> {
	const { data } = await api.patch(`/v1/user/${id}/role`, { role });
	return appUserSchema.parse(data);
}

export async function setUserBlocked(
	id: string,
	blocked: boolean,
): Promise<AppUser> {
	const { data } = await api.patch(`/v1/user/${id}/block`, { blocked });
	return appUserSchema.parse(data);
}

export async function setUserPassword(
	id: string,
	newPassword: string,
): Promise<void> {
	await api.patch(`/v1/user/${id}/password`, { new_password: newPassword });
}

export async function promoteUser(
	id: string,
	role: Extract<UserRole, 'staff' | 'admin'>,
): Promise<AppUser> {
	const { data } = await api.post(`/v1/user/${id}/promote`, { role });
	return appUserSchema.parse(data);
}

export async function demoteUser(
	id: string,
	role: Extract<UserRole, 'customer' | 'staff'>,
): Promise<AppUser> {
	const { data } = await api.post(`/v1/user/${id}/demote`, { role });
	return appUserSchema.parse(data);
}

export async function deleteUser(id: string): Promise<void> {
	await api.delete(`/v1/user/${id}`);
}
