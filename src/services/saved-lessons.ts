import { AxiosError } from 'axios';
import { apiCourses } from '@/shared/lib/api-courses';
import type {
	SavedLesson,
	SavedLessonApi,
	SavedLessonsResponse,
} from '@/types/saved-lessons';
import { savedLessonApiSchema } from '@/types/saved-lessons';

function toSavedLesson(row: SavedLessonApi): SavedLesson {
	return {
		id: row.id,
		lessonId: row.lesson_id,
		lesson: {
			id: row.lesson.id,
			title: row.lesson.title,
			duration: row.lesson.duration_seconds,
		},
		courseSlug: row.course.slug,
		courseName: row.course.title,
	};
}

export async function getSavedLessons(): Promise<SavedLessonsResponse> {
	const { data } = await apiCourses.get<unknown>('/v1/me/saved-lessons');
	const arr = Array.isArray(data) ? data : [];
	// Um item fora do contrato não pode derrubar a lista inteira — descarta só ele.
	return arr.flatMap((item) => {
		const parsed = savedLessonApiSchema.safeParse(item);
		return parsed.success ? [toSavedLesson(parsed.data)] : [];
	});
}

export async function saveLesson(
	lessonId: string,
): Promise<SavedLesson | null> {
	const { data } = await apiCourses.post<unknown>('/v1/me/saved-lessons', {
		lesson_id: lessonId,
	});
	// A aula já foi salva no servidor: um corpo de resposta magro não pode virar
	// "Erro ao guardar aula" na cara do aluno — quem manda é o invalidate do
	// hook, que relê a lista.
	const parsed = savedLessonApiSchema.safeParse(data);
	return parsed.success ? toSavedLesson(parsed.data) : null;
}

export async function removeSavedLesson(lessonId: string): Promise<void> {
	await apiCourses.delete(`/v1/me/saved-lesson/${lessonId}`);
}

/**
 * Mensagem que diz o que realmente aconteceu. "Erro ao guardar aula" escondia
 * causas bem diferentes — 403 (sem acesso ao curso) e 409 (já estava salva).
 */
export function savedLessonErrorMessage(err: unknown): string {
	const status = err instanceof AxiosError ? err.response?.status : undefined;
	if (status === 403) return 'Esta aula faz parte do conteúdo dos assinantes.';
	if (status === 409) return 'Esta aula já está nas suas salvas.';
	return 'Não foi possível guardar a aula. Tente novamente.';
}
