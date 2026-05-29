import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type CoursePlan,
	coursePlanSchema,
	type PublicCourse,
	type PublicCourseDetail,
	publicCourseDetailSchema,
	publicCourseSchema,
} from '../types/catalog';

/** Cursos publicados na vitrine. */
export async function listPublicCourses(): Promise<PublicCourse[]> {
	const { data } = await api.get('/v1/courses');
	return publicCourseSchema.array().parse(data);
}

/** Detalhe público de um curso (com planos e tools). */
export async function getPublicCourse(
	slug: string,
): Promise<PublicCourseDetail> {
	const { data } = await api.get(`/v1/course/${slug}`);
	return publicCourseDetailSchema.parse(data);
}

/** Planos disponíveis para um curso. */
export async function listCoursePlans(slug: string): Promise<CoursePlan[]> {
	const { data } = await api.get(`/v1/course/${slug}/plans`);
	return coursePlanSchema.array().parse(data);
}
