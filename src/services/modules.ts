import { db } from '@/lib/db';
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

export async function reorderModules(
	productId: string,
	moduleIds: string[],
): Promise<void> {
	await api.patch('/module/reorder', { productId, moduleIds });
}

export async function reorderLessons(
	moduleId: string,
	lessonIds: string[],
): Promise<void> {
	await api.patch('/lesson/reorder', { moduleId, lessonIds });
}

export async function uploadLessonVideo(
	id: string,
	file: File,
	_onProgress?: (percent: number) => void,
): Promise<Lesson> {
	// Passo 1: gerar URL assinada
	const { data: presigned } = await api.post(
		`/lesson/${id}/video/presigned-url`,
		{
			filename: file.name,
		},
	);
	const { path, token, bucket } = presigned as {
		path: string;
		token: string;
		bucket: string;
	};

	// Passo 2: upload direto ao Supabase (sem passar pelo proxy)
	const { error } = await db.storage
		.from(bucket)
		.uploadToSignedUrl(path, token, file);
	if (error) throw error;

	// Passo 3: confirmar no backend
	const { data } = await api.patch(`/lesson/${id}/video/confirm`, { path });
	return data;
}
