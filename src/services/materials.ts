import { api } from '@/lib/fetch';
import { type Material, materialSchema } from '@/types/materials';

export async function getLessonMaterials(
	lessonId: string,
): Promise<Material[]> {
	const { data } = await api.get(`/lesson/${lessonId}/materials`);
	return materialSchema.array().parse(data);
}

export async function uploadLessonMaterial(
	lessonId: string,
	file: File,
	name?: string,
): Promise<Material> {
	const formData = new FormData();
	formData.append('file', file);
	if (name) formData.append('name', name);

	const { data } = await api.post(`/lesson/${lessonId}/material`, formData, {
		headers: { 'Content-Type': undefined },
	});
	return materialSchema.parse(data);
}

export async function deleteLessonMaterial(
	lessonId: string,
	materialId: string,
): Promise<void> {
	await api.delete(`/lesson/${lessonId}/material/${materialId}`);
}
