import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type Course,
	type CourseDetail,
	type CreateCoursePayload,
	courseDetailSchema,
	courseSchema,
	type UpdateCoursePayload,
} from '../types/courses';

/** Catálogo público — retorna cursos com planos e ferramentas embutidos. */
export async function listCourses(): Promise<CourseDetail[]> {
	const { data } = await api.get('/v1/courses');
	return courseDetailSchema.array().parse(data);
}

export async function listAdminCourses(): Promise<Course[]> {
	const { data } = await api.get('/v1/admin/courses');
	return courseSchema.array().parse(data);
}

/** Busca um curso publicado pelo slug (público). */
export async function getCourseBySlug(slug: string): Promise<Course> {
	const { data } = await api.get(`/v1/course/${slug}`);
	return courseSchema.parse(data);
}

export async function createCourse(
	payload: CreateCoursePayload,
): Promise<Course> {
	const { data } = await api.post('/v1/course', payload);
	return courseSchema.parse(data);
}

export async function updateCourse(
	id: string,
	payload: UpdateCoursePayload,
): Promise<Course> {
	const { data } = await api.patch(`/v1/course/${id}`, payload);
	return courseSchema.parse(data);
}

export async function deleteCourse(id: string): Promise<void> {
	await api.delete(`/v1/course/${id}`);
}

export async function uploadCourseImage(
	id: string,
	file: File,
): Promise<Course> {
	const form = new FormData();
	form.append('file', file);
	// Content-Type é removido pelo interceptor quando data é FormData,
	// deixando o browser definir o boundary do multipart.
	const { data } = await api.post(`/v1/course/${id}/image`, form);
	return courseSchema.parse(data);
}
