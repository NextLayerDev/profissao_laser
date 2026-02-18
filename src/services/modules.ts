import { api } from '@/lib/fetch';
import type {
	CreateLessonPayload,
	CreateModulePayload,
	Lesson,
	Module,
	UpdateLessonPayload,
	UpdateModulePayload,
} from '@/types/modules';

export type {
	CreateLessonPayload,
	CreateModulePayload,
	Lesson,
	Module,
	UpdateLessonPayload,
	UpdateModulePayload,
};

export async function getModules(productId: string): Promise<Module[]> {
	const { data } = await api.get(`/module/${productId}`);
	return data;
}

export async function getLessons(moduleId: string): Promise<Lesson[]> {
	const { data } = await api.get(`/module/${moduleId}/lessons`);
	return data;
}

export async function createModule(
	payload: CreateModulePayload,
): Promise<Module> {
	const { data } = await api.post('/module', payload);
	return data;
}

export async function updateModule(
	id: string,
	payload: UpdateModulePayload,
): Promise<Module> {
	const { data } = await api.put(`/module/${id}`, payload);
	return data;
}

export async function deleteModule(id: string): Promise<void> {
	await api.delete(`/module/${id}`);
}

export async function createLesson(
	payload: CreateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.post('/lesson', payload);
	return data;
}

export async function updateLesson(
	id: string,
	payload: UpdateLessonPayload,
): Promise<Lesson> {
	const { data } = await api.put(`/lesson/${id}`, payload);
	return data;
}

export async function deleteLesson(id: string): Promise<void> {
	await api.delete(`/lesson/${id}`);
}
