import { apiCourses as api } from '@/shared/lib/api-courses';
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

/** Reordena os módulos de um curso na ordem do array de ids. */
export async function reorderCourseModules(
	courseId: string,
	moduleIds: string[],
): Promise<CourseModule[]> {
	const { data } = await api.patch('/v1/modules/reorder', {
		course_id: courseId,
		module_ids: moduleIds,
	});
	return courseModuleSchema.array().parse(data);
}
