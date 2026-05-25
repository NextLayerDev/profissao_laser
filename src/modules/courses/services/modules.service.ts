import { api } from '@/shared/lib/fetch';
import {
	type CourseModule,
	type CreateCourseModulePayload,
	courseModuleSchema,
	type UpdateCourseModulePayload,
} from '../types/modules';

export async function listCourseModules(slug: string): Promise<CourseModule[]> {
	const { data } = await api.get(`/v1/course/${slug}/modules`);
	return courseModuleSchema.array().parse(data);
}

export async function createCourseModule(
	payload: CreateCourseModulePayload,
): Promise<CourseModule> {
	const { data } = await api.post('/v1/module', payload);
	return courseModuleSchema.parse(data);
}

export async function updateCourseModule(
	id: string,
	payload: UpdateCourseModulePayload,
): Promise<CourseModule> {
	const { data } = await api.patch(`/v1/module/${id}`, payload);
	return courseModuleSchema.parse(data);
}

export async function deleteCourseModule(id: string): Promise<void> {
	await api.delete(`/v1/module/${id}`);
}
