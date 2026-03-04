import { api } from '@/lib/fetch';
import type { SavedLesson, SavedLessonsResponse } from '@/types/saved-lessons';
import { savedLessonSchema } from '@/types/saved-lessons';

export async function getSavedLessons(): Promise<SavedLessonsResponse> {
	const { data } = await api.get<unknown>('/customer/saved-lessons');
	const arr = Array.isArray(data) ? data : [];
	return arr.map((item) =>
		savedLessonSchema.parse(item),
	) as SavedLessonsResponse;
}

export async function saveLesson(lessonId: string): Promise<SavedLesson> {
	const { data } = await api.post<unknown>('/customer/saved-lessons', {
		lessonId,
	});
	return savedLessonSchema.parse(data);
}

export async function removeSavedLesson(lessonId: string): Promise<void> {
	await api.delete(`/customer/saved-lessons/${lessonId}`);
}
