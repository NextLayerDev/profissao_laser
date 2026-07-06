import { apiCourses as api } from '@/shared/lib/api-courses';
import { type FreeLesson, freeLessonSchema } from '../types/free-lesson';

/** Prévia de aulas grátis liberadas para qualquer usuário logado (sem exigir assinatura). */
export async function listFreeLessons(): Promise<FreeLesson[]> {
	const { data } = await api.get('/v1/lessons/free');
	return freeLessonSchema.array().parse(data);
}
