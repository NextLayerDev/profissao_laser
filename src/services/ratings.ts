import { api } from '@/lib/fetch';
import type { LessonRating } from '@/types/doubts';

export async function getLessonRating(lessonId: string): Promise<LessonRating> {
	const { data } = await api.get<LessonRating>(`/lesson/${lessonId}/rating`);
	return data;
}

export async function submitLessonRating(
	lessonId: string,
	payload: { stars: number },
): Promise<LessonRating> {
	const { data } = await api.post<LessonRating>(
		`/lesson/${lessonId}/rating`,
		payload,
	);
	return data;
}
