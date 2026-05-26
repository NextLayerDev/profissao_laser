import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type CreateLessonPayload,
	type Lesson,
	lessonSchema,
	type UpdateLessonPayload,
} from '../types/lessons';

export async function listModuleLessons(moduleId: string): Promise<Lesson[]> {
	const { data } = await api.get(`/v1/module/${moduleId}/lessons`);
	return lessonSchema.array().parse(data);
}

export async function createLesson(
	payload: CreateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.post('/v1/lesson', payload);
	return lessonSchema.parse(data);
}

export async function updateLesson(
	id: string,
	payload: UpdateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.patch(`/v1/lesson/${id}`, payload);
	return lessonSchema.parse(data);
}

export async function deleteLesson(id: string): Promise<void> {
	await api.delete(`/v1/lesson/${id}`);
}
