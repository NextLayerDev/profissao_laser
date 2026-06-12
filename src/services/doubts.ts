import { api } from '@/lib/fetch';
import type {
	AdminLessonDoubtsResponse,
	AdminLessonDoubtsStatus,
	Doubt,
} from '@/types/doubts';

export interface GetDoubtsParams {
	page?: number;
	limit?: number;
}

export async function getLessonDoubts(
	lessonId: string,
	params?: GetDoubtsParams,
): Promise<Doubt[]> {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set('page', String(params.page));
	if (params?.limit) searchParams.set('limit', String(params.limit));
	const query = searchParams.toString();
	const url = `/lesson/${lessonId}/doubts${query ? `?${query}` : ''}`;
	const { data } = await api.get<Doubt[]>(url);
	return Array.isArray(data) ? data : [];
}

export async function createDoubt(
	lessonId: string,
	content: string,
): Promise<Doubt> {
	const { data } = await api.post<Doubt>(`/lesson/${lessonId}/doubt`, {
		content,
	});
	return data;
}

export async function replyToDoubt(
	doubtId: string,
	content: string,
): Promise<Doubt['replies'][0]> {
	const { data } = await api.post<Doubt['replies'][0]>(
		`/doubt/${doubtId}/reply`,
		{ content },
	);
	return data;
}

export interface GetAdminLessonDoubtsParams {
	status?: AdminLessonDoubtsStatus;
	page?: number;
	limit?: number;
}

/** Visão agregada do admin: todas as dúvidas de aula em uma chamada. */
export async function getAdminLessonDoubts(
	params?: GetAdminLessonDoubtsParams,
): Promise<AdminLessonDoubtsResponse> {
	const searchParams = new URLSearchParams();
	if (params?.status) searchParams.set('status', params.status);
	if (params?.page) searchParams.set('page', String(params.page));
	if (params?.limit) searchParams.set('limit', String(params.limit));
	const query = searchParams.toString();
	const { data } = await api.get<AdminLessonDoubtsResponse>(
		`/doubts/admin${query ? `?${query}` : ''}`,
	);
	return data;
}
