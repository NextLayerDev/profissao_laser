import { api } from '@/lib/fetch';

export interface CourseProgress {
	watchedLessonIds: string[];
}

export async function getCourseProgress(
	courseId: string,
	customerId?: string,
): Promise<CourseProgress> {
	const params = customerId ? { customerId } : {};
	const { data } = await api.get<CourseProgress>(
		`/course/${courseId}/progress`,
		{ params },
	);
	return data;
}

export async function markLessonComplete(
	lessonId: string,
	customerId?: string,
): Promise<void> {
	await api.post(
		`/lesson/${lessonId}/complete`,
		customerId ? { customerId } : {},
	);
}
