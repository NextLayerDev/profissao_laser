import { api } from '@/lib/fetch';
import { type Course, courseSchema } from '@/types/course';

export async function getCourse(slug: string): Promise<Course> {
	const { data } = await api.get(`/course/${slug}`);
	const result = courseSchema.safeParse(data);
	if (result.success) return result.data;

	// API pode retornar modules sem lessons aninhadas — normaliza
	const normalized = {
		...data,
		modules: Array.isArray(data.modules)
			? data.modules.map((m: Record<string, unknown>) => ({
					...m,
					lessons: Array.isArray(m.lessons) ? m.lessons : [],
				}))
			: [],
	};
	return courseSchema.parse(normalized);
}
