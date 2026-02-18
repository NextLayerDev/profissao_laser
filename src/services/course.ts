import { api } from '@/lib/fetch';
import { type Course, courseSchema } from '@/types/course';

export async function getCourse(slug: string): Promise<Course> {
	const { data } = await api.get(`/course/${slug}`);
	return courseSchema.parse(data);
}
