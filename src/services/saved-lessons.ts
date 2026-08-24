import { api } from '@/lib/fetch';
import type { SavedLesson, SavedLessonsResponse } from '@/types/saved-lessons';
import { savedLessonSchema } from '@/types/saved-lessons';

export async function getSavedLessons(): Promise<SavedLessonsResponse> {
	const { data } = await api.get<unknown>('/customer/saved-lessons');
	const arr = Array.isArray(data) ? data : [];
	// Um item fora do contrato não pode derrubar a lista inteira — descarta só ele.
	return arr.flatMap((item) => {
		const parsed = savedLessonSchema.safeParse(item);
		return parsed.success ? [parsed.data] : [];
	});
}

export async function saveLesson(
	lessonId: string,
): Promise<SavedLesson | null> {
	const { data } = await api.post<unknown>('/customer/saved-lessons', {
		lessonId,
	});
	// A aula já foi salva no servidor: um corpo de resposta magro (ou 204) não
	// pode virar "Erro ao guardar aula" na cara do aluno — quem manda é o
	// invalidate do hook, que relê a lista.
	const parsed = savedLessonSchema.safeParse(data);
	return parsed.success ? parsed.data : null;
}

export async function removeSavedLesson(lessonId: string): Promise<void> {
	await api.delete(`/customer/saved-lessons/${lessonId}`);
}
