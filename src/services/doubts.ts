import { api } from '@/lib/fetch';
import type { Doubt } from '@/types/doubts';

export async function getLessonDoubts(
	lessonId: string,
	page = 1,
	limit = 20,
): Promise<Doubt[]> {
	const { data } = await api.get<Doubt[]>(
		`/lesson/${lessonId}/doubts?page=${page}&limit=${limit}`,
	);
	return Array.isArray(data) ? data : [];
}

export async function createLessonDoubt(
	lessonId: string,
	payload: { content: string },
): Promise<Doubt> {
	const { data } = await api.post<Doubt>(`/lesson/${lessonId}/doubt`, payload);
	return data;
}

export async function replyToDoubt(
	doubtId: string,
	payload: { content: string },
): Promise<{
	id: string;
	content: string;
	authorName: string;
	createdAt: string;
	isInstructor: boolean;
}> {
	const { data } = await api.post(`/doubt/${doubtId}/reply`, payload);
	return data;
}
